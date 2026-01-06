package com.nexus.casino.websocket;

import com.nexus.casino.security.JwtTokenProvider;
import com.nexus.casino.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUsernames = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = getTokenFromSession(session);
        if (token != null && jwtTokenProvider.validateToken(token, 
                userService.loadUserByUsername(jwtTokenProvider.extractUsername(token)))) {
            String username = jwtTokenProvider.extractUsername(token);
            sessions.put(session.getId(), session);
            sessionUsernames.put(session.getId(), username);
            
            broadcastMessage(new ChatMessage("System", username + " joined the chat", "USER_JOINED"));
            log.info("User {} connected", username);
        } else {
            session.close(CloseStatus.BAD_DATA);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String username = sessionUsernames.get(session.getId());
        if (username == null) {
            return;
        }

        try {
            ChatMessageRequest request = ChatMessageRequest.fromJson(message.getPayload());
            ChatMessage chatMessage = new ChatMessage(username, request.getMessage(), "CHAT_MESSAGE");
            broadcastMessage(chatMessage);
        } catch (Exception e) {
            log.error("Error handling message", e);
            sendToSession(session, new ChatMessage("System", "Error processing message", "ERROR"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String username = sessionUsernames.remove(session.getId());
        sessions.remove(session.getId());
        
        if (username != null) {
            broadcastMessage(new ChatMessage("System", username + " left the chat", "USER_LEFT"));
            log.info("User {} disconnected", username);
        }
    }

    private void broadcastMessage(ChatMessage message) {
        String jsonMessage = message.toJson();
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(jsonMessage));
                }
            } catch (IOException e) {
                log.error("Error sending message to session", e);
            }
        });
    }

    private void sendToSession(WebSocketSession session, ChatMessage message) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message.toJson()));
            }
        } catch (IOException e) {
            log.error("Error sending message to session", e);
        }
    }

    private String getTokenFromSession(WebSocketSession session) {
        String query = session.getUri().getQuery();
        if (query != null && query.startsWith("token=")) {
            return query.substring(6);
        }
        return null;
    }

    private static class ChatMessage {
        private final String username;
        private final String message;
        private final String type;
        private final long timestamp;

        public ChatMessage(String username, String message, String type) {
            this.username = username;
            this.message = message;
            this.type = type;
            this.timestamp = System.currentTimeMillis();
        }

        public String toJson() {
            return String.format(
                "{\"type\":\"%s\",\"payload\":{\"id\":\"%d\",\"username\":\"%s\",\"message\":\"%s\",\"timestamp\":\"%s\"}}",
                type, timestamp, escapeJson(username), escapeJson(message), new java.util.Date(timestamp).toInstant().toString()
            );
        }

        private String escapeJson(String str) {
            return str.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
        }
    }

    private static class ChatMessageRequest {
        private String type;
        private Payload payload;

        public static ChatMessageRequest fromJson(String json) {
            try {
                // Simple JSON parsing - in production, use Jackson ObjectMapper
                if (json.contains("\"type\":\"CHAT_MESSAGE\"")) {
                    ChatMessageRequest request = new ChatMessageRequest();
                    request.type = "CHAT_MESSAGE";
                    request.payload = new Payload();
                    
                    // Extract message from payload
                    int payloadStart = json.indexOf("\"payload\":{");
                    if (payloadStart > 0) {
                        int messageStart = json.indexOf("\"message\":\"", payloadStart) + 11;
                        if (messageStart > 10) {
                            int messageEnd = json.indexOf("\"", messageStart);
                            if (messageEnd > messageStart) {
                                request.payload.message = json.substring(messageStart, messageEnd)
                                    .replace("\\\"", "\"")
                                    .replace("\\n", "\n")
                                    .replace("\\r", "\r")
                                    .replace("\\t", "\t");
                            }
                        }
                    }
                    return request;
                }
            } catch (Exception e) {
                // Fall through to throw
            }
            throw new IllegalArgumentException("Invalid message format");
        }

        public String getMessage() {
            return payload != null ? payload.message : "";
        }

        private static class Payload {
            private String message;
        }
    }
}

