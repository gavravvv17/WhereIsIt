package com.whereisit.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otpCode, String subjectTitle) {
        String subject = "WhereIsIt - " + subjectTitle + " Verification Code";
        String messageText = String.format(
            "Hello,\n\nYour 6-digit verification code for WhereIsIt (%s) is:\n\n   %s   \n\n" +
            "This code is valid for 10 minutes. Please do not share this code with anyone.\n\n" +
            "Best regards,\nWhereIsIt Team",
            subjectTitle, otpCode
        );

        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailUsername);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(messageText);
                mailSender.send(message);
                logger.info("OTP email dispatched successfully to: {}", toEmail);
                return;
            } catch (Exception e) {
                logger.warn("SMTP email dispatch failed to {}: {}. Falling back to dev logger.", toEmail, e.getMessage());
            }
        } else {
            logger.info("SMTP credentials not configured. Using dev logger fallback.");
        }

        // Development/Console logger fallback
        logger.info("=================================================");
        logger.info("DEV OTP NOTIFICATION");
        logger.info("To: {}", toEmail);
        logger.info("Subject: {}", subject);
        logger.info("OTP Code: {}", otpCode);
        logger.info("=================================================");
    }
}
