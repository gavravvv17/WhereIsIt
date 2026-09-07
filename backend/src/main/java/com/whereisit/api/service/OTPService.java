package com.whereisit.api.service;

import com.whereisit.api.entity.OtpToken;
import com.whereisit.api.entity.OtpType;
import com.whereisit.api.repository.OtpTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OTPService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    public OTPService(OtpTokenRepository otpTokenRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public void generateAndSendOtp(String email, OtpType type, String subjectTitle) {
        String cleanEmail = email.toLowerCase().trim();

        Optional<OtpToken> existingOpt = otpTokenRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(cleanEmail, type);
        if (existingOpt.isPresent()) {
            OtpToken existing = existingOpt.get();
            long secondsSinceLastSent = Duration.between(existing.getLastSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceLastSent < RESEND_COOLDOWN_SECONDS) {
                long waitRemaining = RESEND_COOLDOWN_SECONDS - secondsSinceLastSent;
                throw new IllegalArgumentException("Please wait " + waitRemaining + " seconds before requesting a new OTP.");
            }
        }

        otpTokenRepository.deleteByEmailAndType(cleanEmail, type);

        int otpInt = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(otpInt);

        String hashedOtp = passwordEncoder.encode(otpCode);

        OtpToken otpToken = new OtpToken(
            cleanEmail,
            hashedOtp,
            type,
            LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)
        );

        otpTokenRepository.save(otpToken);

        emailService.sendOtpEmail(cleanEmail, otpCode, subjectTitle);
    }

    @Transactional
    public void verifyOtp(String email, String inputOtp, OtpType type, boolean burnToken) {
        String cleanEmail = email.toLowerCase().trim();

        OtpToken otpToken = otpTokenRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(cleanEmail, type)
                .orElseThrow(() -> new IllegalArgumentException("No active OTP found. Please request a new code."));

        if (otpToken.getIsUsed()) {
            throw new IllegalArgumentException("This OTP has already been used. Please request a new code.");
        }

        if (LocalDateTime.now().isAfter(otpToken.getExpiresAt())) {
            throw new IllegalArgumentException("OTP has expired. Please request a new code.");
        }

        if (otpToken.getAttempts() >= MAX_ATTEMPTS) {
            throw new IllegalArgumentException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        boolean matches = passwordEncoder.matches(inputOtp, otpToken.getOtpHash());
        if (!matches) {
            otpToken.setAttempts(otpToken.getAttempts() + 1);
            otpTokenRepository.save(otpToken);
            int remainingAttempts = MAX_ATTEMPTS - otpToken.getAttempts();
            if (remainingAttempts <= 0) {
                throw new IllegalArgumentException("Maximum verification attempts exceeded. Please request a new OTP.");
            }
            throw new IllegalArgumentException("Incorrect OTP. You have " + remainingAttempts + " attempts remaining.");
        }

        if (burnToken) {
            otpToken.setIsUsed(true);
            otpTokenRepository.save(otpToken);
        }
    }
}
