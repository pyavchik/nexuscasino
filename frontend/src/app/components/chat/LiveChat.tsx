import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { MessageCircle, Send } from 'lucide-react';
import { wsClient, ChatMessage } from '../../../lib/websocket';

interface LiveChatProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function LiveChat({ isOpen, onToggle }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    const handleUserJoined = (data: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          username: 'System',
          message: `${data.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const handleUserLeft = (data: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          username: 'System',
          message: `${data.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    wsClient.on('CHAT_MESSAGE', handleChatMessage);
    wsClient.on('USER_JOINED', handleUserJoined);
    wsClient.on('USER_LEFT', handleUserLeft);

    return () => {
      wsClient.off('CHAT_MESSAGE', handleChatMessage);
      wsClient.off('USER_JOINED', handleUserJoined);
      wsClient.off('USER_LEFT', handleUserLeft);
    };
  }, []);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const handleSend = () => {
    if (inputMessage.trim()) {
      wsClient.sendChatMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-[100] rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-[100] w-96 h-[500px] flex flex-col bg-slate-900/95 backdrop-blur-xl border-slate-800 shadow-2xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white">Live Chat</h3>
        </div>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white"
        >
          ✕
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4 select-text" ref={scrollAreaRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.username === 'System' ? 'items-center' : 'items-start'
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    msg.username === 'System'
                      ? 'bg-slate-800/50 text-slate-400 text-xs'
                      : 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white'
                  }`}
                >
                  {msg.username !== 'System' && (
                    <div className="text-xs text-purple-400 mb-1 font-semibold">
                      {msg.username}
                    </div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-800 flex gap-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
        <Button
          onClick={handleSend}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="icon"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

