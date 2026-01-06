package com.nexus.casino.controller;

import com.nexus.casino.dto.GamePlayRequest;
import com.nexus.casino.dto.GameRecordDto;
import com.nexus.casino.entity.User;
import com.nexus.casino.repository.UserRepository;
import com.nexus.casino.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final UserRepository userRepository;

    @PostMapping("/play")
    public ResponseEntity<GameRecordDto> playGame(
            @Valid @RequestBody GamePlayRequest request,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        GameRecordDto result = gameService.playGame(user, request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<List<GameRecordDto>> getGameHistory(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<GameRecordDto> history = gameService.getGameHistory(user);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/history")
    public ResponseEntity<Map<String, String>> clearGameHistory(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        gameService.clearGameHistory(user);
        return ResponseEntity.ok(java.util.Map.of("message", "Game history cleared"));
    }
}

