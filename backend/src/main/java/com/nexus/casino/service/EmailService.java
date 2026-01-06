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
    
    @Value("${spring.mail.host:}")
    private String smtpHost;
    
    @Value("${spring.mail.port:587}")
    private String smtpPort;
    
    @Value("${spring.mail.username:}")
    private String smtpUsername;
    
    @Value("${spring.mail.password:}")
    private String smtpPassword;

    public void sendPasswordResetEmail(String toEmail, String token) {
        log.info("=== EmailService.sendPasswordResetEmail called ===");
        log.info("Email enabled: {}", emailEnabled);
        log.info("SMTP Host: {}", smtpHost != null && !smtpHost.isEmpty() ? smtpHost : "NOT SET");
        log.info("SMTP Port: {}", smtpPort);
        log.info("SMTP Username: {}", smtpUsername != null && !smtpUsername.isEmpty() ? smtpUsername : "NOT SET");
        log.info("SMTP Password: {}", smtpPassword != null && !smtpPassword.isEmpty() ? "***SET***" : "NOT SET");
        log.info("Frontend URL: {}", frontendUrl);
        log.info("Recipient: {}", toEmail);
        log.info("Token length: {}", token != null ? token.length() : 0);
        
        if (!emailEnabled) {
            log.warn("Email sending is disabled. Token for {}: {}", toEmail, token);
            return;
        }

        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + token;
            log.info("Reset URL: {}", resetUrl);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Password Reset Request - Nexus Casino");
            message.setText(buildPasswordResetEmailBody(resetUrl, token));
            
            log.info("Email message prepared. From: {}, To: {}, Subject: {}", 
                message.getFrom(), message.getTo(), message.getSubject());
            log.debug("Email body length: {} characters", 
                message.getText() != null ? message.getText().length() : 0);
            
            mailSender.send(message);
            log.info("✅ Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Failed to send password reset email to: {}", toEmail, e);
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("Caused by: {} - {}", e.getCause().getClass().getName(), e.getCause().getMessage());
            }
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

