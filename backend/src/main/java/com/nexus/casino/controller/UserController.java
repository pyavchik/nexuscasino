package com.nexus.casino.controller;

import com.nexus.casino.dto.UserDto;
import com.nexus.casino.entity.User;
import com.nexus.casino.repository.UserRepository;
import com.nexus.casino.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/balance")
    public ResponseEntity<BigDecimal> getBalance(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        BigDecimal balance = userService.getBalance(user);
        return ResponseEntity.ok(balance);
    }

    @PutMapping("/balance")
    public ResponseEntity<UserDto> updateBalance(
            @RequestBody BalanceUpdateRequest request,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDto updatedUser = userService.updateBalance(user, request.getAmount());
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/balance/reset")
    public ResponseEntity<UserDto> resetBalance(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserDto updatedUser = userService.resetBalance(user);
        return ResponseEntity.ok(updatedUser);
    }

    @lombok.Data
    static class BalanceUpdateRequest {
        private BigDecimal amount;
    }
}

