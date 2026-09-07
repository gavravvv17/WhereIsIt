package com.whereisit.api.controller;

import com.whereisit.api.dto.*;
import com.whereisit.api.security.UserPrincipal;
import com.whereisit.api.service.AuthenticationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    @Autowired
    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authenticationService.loginUser(loginRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid email or password");
        }
    }

    @PostMapping("/register/init")
    public ResponseEntity<?> initiateRegistration(@Valid @RequestBody RegisterInitRequest request) {
        try {
            authenticationService.initiateRegistration(request);
            Map<String, String> response = Collections.singletonMap("message", "A 6-digit OTP code has been sent to your email.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register/verify")
    public ResponseEntity<?> verifyRegistration(@Valid @RequestBody RegisterVerifyRequest request) {
        try {
            AuthResponse response = authenticationService.verifyRegistration(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        try {
            authenticationService.resendOtp(request);
            Map<String, String> response = Collections.singletonMap("message", "A new OTP code has been sent to your email.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password/init")
    public ResponseEntity<?> initiateForgotPassword(@Valid @RequestBody ForgotPasswordInitRequest request) {
        try {
            authenticationService.initiateForgotPassword(request);
            Map<String, String> response = Collections.singletonMap("message", "A 6-digit OTP code has been sent to your email.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password/verify")
    public ResponseEntity<?> verifyForgotPassword(@Valid @RequestBody ForgotPasswordVerifyRequest request) {
        try {
            authenticationService.verifyForgotPassword(request);
            Map<String, String> response = Collections.singletonMap("message", "OTP verified successfully.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetForgotPassword(@Valid @RequestBody ForgotPasswordResetRequest request) {
        try {
            authenticationService.resetForgotPassword(request);
            Map<String, String> response = Collections.singletonMap("message", "Password updated successfully. You can now sign in with your new password.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return new ResponseEntity<>("Not authenticated", HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.ok(new UserDto(userPrincipal.getId(), userPrincipal.getName(), userPrincipal.getEmail()));
    }
}
