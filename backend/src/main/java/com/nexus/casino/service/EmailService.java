package com.nexus.casino.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:https://pyavchik.space}")
    private String frontendUrl;

    @Value("${spring.mail.enabled:true}")
    private boolean emailEnabled;

    public void sendPasswordResetEmail(String toEmail, String token) {
        if (!emailEnabled) {
            log.warn("Email sending is disabled. Token for {}: {}", toEmail, token);
            return;
        }

        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + token;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Password Reset Request - Nexus Casino");
            message.setText(buildPasswordResetEmailBody(resetUrl, token));
            
            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    private String buildPasswordResetEmailBody(String resetUrl, String token) {
        return String.format("""
            Hello,
            
            You have requested to reset your password for your Nexus Casino account.
            
            Click the link below to reset your password:
            %s
            
            Or use this token manually:
            %s
            
            This link will expire in 1 hour.
            
            If you did not request this password reset, please ignore this email.
            
            Best regards,
            Nexus Casino Team
            """, resetUrl, token);
    }
}

