package com.nexus.casino.service;

import com.nexus.casino.entity.PasswordResetToken;
import com.nexus.casino.entity.User;
import com.nexus.casino.repository.PasswordResetTokenRepository;
import com.nexus.casino.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        // Always return success message for security (don't reveal if email exists)
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", email);
            return "If the email exists, a reset token has been generated.";
        }

        User user = userOpt.get();
        
        // Invalidate existing tokens for this user
        tokenRepository.invalidateAllTokensForUser(user);
        
        // Generate new token
        String token = generateSecureToken();
        
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        
        tokenRepository.save(resetToken);
        
        log.info("Password reset token generated for user: {}", email);
        
        // In demo mode, return the token directly
        // In production, this would be sent via email
        return token;
    }

    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository
                .findByTokenAndUsedFalseAndExpiryDateAfter(token, LocalDateTime.now());
        
        if (tokenOpt.isEmpty()) {
            log.warn("Invalid or expired password reset token attempted");
            return false;
        }

        PasswordResetToken resetToken = tokenOpt.get();
        User user = resetToken.getUser();
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        
        log.info("Password reset successful for user: {}", user.getEmail());
        return true;
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
    }
}

