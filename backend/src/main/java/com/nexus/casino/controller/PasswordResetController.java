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
        String result = passwordResetService.requestPasswordReset(request.getEmail());
        
        // Handle different return values from service
        if (result.equals("Email sent")) {
            // Email was sent successfully
            return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email, a password reset link has been sent."
            ));
        } else if (result.equals("If the email exists, a reset token has been generated.")) {
            // Email doesn't exist - return generic message for security
            return ResponseEntity.ok(Map.of(
                    "message", "If an account exists with this email, a password reset link has been sent."
            ));
        } else {
            // Email disabled - return token for development/testing
            return ResponseEntity.ok(Map.of(
                    "message", "Password reset token generated. Check your email for the reset link.",
                    "token", result
            ));
        }
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

