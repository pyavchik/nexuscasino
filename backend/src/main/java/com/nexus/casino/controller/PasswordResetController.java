package com.nexus.casino.controller;

import com.nexus.casino.dto.PasswordResetConfirmRequest;
import com.nexus.casino.dto.PasswordResetRequest;
import com.nexus.casino.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequest request) {
        String token = passwordResetService.requestPasswordReset(request.getEmail());
        
        // In demo mode, return the token in the response
        // In production, this would only return a success message
        return ResponseEntity.ok(Map.of(
                "message", "Password reset token generated",
                "token", token, // Remove this in production - send via email instead
                "note", "In production, this token would be sent via email"
        ));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        boolean success = passwordResetService.resetPassword(
                request.getToken(),
                request.getNewPassword()
        );
        
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid or expired reset token"));
        }
    }
}

