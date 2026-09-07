package com.whereisit.api.service;

import com.whereisit.api.dto.*;
import com.whereisit.api.entity.OtpType;
import com.whereisit.api.entity.User;
import com.whereisit.api.repository.UserRepository;
import com.whereisit.api.security.JwtTokenProvider;
import com.whereisit.api.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OTPService otpService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Autowired
    public AuthenticationService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                  OTPService otpService, AuthenticationManager authenticationManager,
                                  JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public void initiateRegistration(RegisterInitRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password and Confirm Password do not match");
        }

        String cleanEmail = request.getEmail().toLowerCase().trim();

        userRepository.findByEmail(cleanEmail).ifPresent(existingUser -> {
            if (Boolean.TRUE.equals(existingUser.getIsVerified())) {
                throw new IllegalArgumentException("Email address is already registered and verified!");
            }
        });

        User user = userRepository.findByEmail(cleanEmail).orElseGet(User::new);
        user.setName(request.getName());
        user.setEmail(cleanEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsVerified(false);
        userRepository.save(user);

        otpService.generateAndSendOtp(cleanEmail, OtpType.SIGNUP, "Sign Up");
    }

    @Transactional
    public AuthResponse verifyRegistration(RegisterVerifyRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        otpService.verifyOtp(cleanEmail, request.getOtp(), OtpType.SIGNUP, true);

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("User record not found"));

        user.setIsVerified(true);
        User savedUser = userRepository.save(user);

        return generateAuthResponseForVerifiedUser(savedUser);
    }

    @Transactional
    public AuthResponse loginUser(LoginRequest loginRequest) {
        String cleanEmail = loginRequest.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new IllegalArgumentException("UNVERIFIED_EMAIL: Please verify your email before logging in.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        return new AuthResponse(jwt, userPrincipal.getId(), userPrincipal.getName(), userPrincipal.getEmail());
    }

    @Transactional
    public AuthResponse generateAuthResponseForVerifiedUser(User user) {
        UserPrincipal userPrincipal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        return new AuthResponse(jwt, user.getId(), user.getName(), user.getEmail());
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        if (request.getType() == OtpType.SIGNUP) {
            User user = userRepository.findByEmail(cleanEmail)
                    .orElseThrow(() -> new IllegalArgumentException("No pending registration found for this email."));
            if (Boolean.TRUE.equals(user.getIsVerified())) {
                throw new IllegalArgumentException("Email is already verified. Please sign in.");
            }
            otpService.generateAndSendOtp(cleanEmail, OtpType.SIGNUP, "Sign Up Verification");
        } else if (request.getType() == OtpType.FORGOT_PASSWORD) {
            User user = userRepository.findByEmail(cleanEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Account with this email does not exist."));
            if (!Boolean.TRUE.equals(user.getIsVerified())) {
                throw new IllegalArgumentException("Email is not verified.");
            }
            otpService.generateAndSendOtp(cleanEmail, OtpType.FORGOT_PASSWORD, "Password Reset");
        }
    }

    @Transactional
    public void initiateForgotPassword(ForgotPasswordInitRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("Account with this email does not exist."));

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new IllegalArgumentException("Account email is not verified.");
        }

        otpService.generateAndSendOtp(cleanEmail, OtpType.FORGOT_PASSWORD, "Password Reset");
    }

    @Transactional
    public void verifyForgotPassword(ForgotPasswordVerifyRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        otpService.verifyOtp(cleanEmail, request.getOtp(), OtpType.FORGOT_PASSWORD, false);
    }

    @Transactional
    public void resetForgotPassword(ForgotPasswordResetRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password and Confirm Password do not match");
        }

        String cleanEmail = request.getEmail().toLowerCase().trim();

        otpService.verifyOtp(cleanEmail, request.getOtp(), OtpType.FORGOT_PASSWORD, true);

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new IllegalArgumentException("User record not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
