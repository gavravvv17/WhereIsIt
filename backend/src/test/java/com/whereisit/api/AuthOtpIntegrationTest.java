package com.whereisit.api;

import com.whereisit.api.dto.*;
import com.whereisit.api.entity.OtpToken;
import com.whereisit.api.entity.OtpType;
import com.whereisit.api.entity.User;
import com.whereisit.api.repository.OtpTokenRepository;
import com.whereisit.api.repository.UserRepository;
import com.whereisit.api.service.AuthenticationService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
class AuthOtpIntegrationTest {

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void testCompleteSignUpAndForgotPasswordFlows() {
        String testEmail = "testuser_" + System.currentTimeMillis() + "@example.com";
        String initialPassword = "Password123!";
        String newPassword = "NewPassword456!";
        String testOtp = "654321";
        String testOtpHash = passwordEncoder.encode(testOtp);

        // ==========================================
        // FLOW 1: SIGN UP & EMAIL VERIFICATION
        // ==========================================

        // Step 1: Initiate Register
        RegisterInitRequest initReq = new RegisterInitRequest();
        initReq.setName("Test Traveler");
        initReq.setEmail(testEmail);
        initReq.setPassword(initialPassword);
        initReq.setConfirmPassword(initialPassword);

        authenticationService.initiateRegistration(initReq);

        // Check user created with isVerified = false
        User unverifiedUser = userRepository.findByEmail(testEmail).orElseThrow();
        Assertions.assertFalse(unverifiedUser.getIsVerified(), "User should initially be unverified");

        // Verify unverified user cannot log in
        LoginRequest unverifiedLoginReq = new LoginRequest();
        unverifiedLoginReq.setEmail(testEmail);
        unverifiedLoginReq.setPassword(initialPassword);
        Assertions.assertThrows(IllegalArgumentException.class, () -> {
            authenticationService.loginUser(unverifiedLoginReq);
        }, "Unverified user login should be rejected");

        // Set known test OTP hash
        OtpToken signupToken = otpTokenRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(testEmail, OtpType.SIGNUP).orElseThrow();
        signupToken.setOtpHash(testOtpHash);
        otpTokenRepository.save(signupToken);

        // Step 2: Verify valid OTP & Complete Signup
        RegisterVerifyRequest validVerifyReq = new RegisterVerifyRequest();
        validVerifyReq.setEmail(testEmail);
        validVerifyReq.setOtp(testOtp);

        AuthResponse signupAuth = authenticationService.verifyRegistration(validVerifyReq);
        Assertions.assertNotNull(signupAuth.getToken(), "JWT Token should be returned upon successful verification");

        // Verify user is now marked as verified
        User verifiedUser = userRepository.findByEmail(testEmail).orElseThrow();
        Assertions.assertTrue(verifiedUser.getIsVerified(), "User should be marked as verified");

        // Step 3: Login with verified account
        LoginRequest validLoginReq = new LoginRequest();
        validLoginReq.setEmail(testEmail);
        validLoginReq.setPassword(initialPassword);

        AuthResponse loginAuth = authenticationService.loginUser(validLoginReq);
        Assertions.assertNotNull(loginAuth.getToken(), "Login should succeed for verified user");

        // ==========================================
        // FLOW 2: FORGOT PASSWORD & RESET
        // ==========================================

        // Step 1: Initiate Forgot Password
        ForgotPasswordInitRequest forgotInitReq = new ForgotPasswordInitRequest();
        forgotInitReq.setEmail(testEmail);

        authenticationService.initiateForgotPassword(forgotInitReq);

        // Set known OTP hash for forgot password token
        OtpToken forgotToken = otpTokenRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(testEmail, OtpType.FORGOT_PASSWORD).orElseThrow();
        forgotToken.setOtpHash(testOtpHash);
        otpTokenRepository.save(forgotToken);

        // Step 2: Verify Forgot Password OTP
        ForgotPasswordVerifyRequest forgotVerifyReq = new ForgotPasswordVerifyRequest();
        forgotVerifyReq.setEmail(testEmail);
        forgotVerifyReq.setOtp(testOtp);

        authenticationService.verifyForgotPassword(forgotVerifyReq);

        // Step 3: Reset Password
        ForgotPasswordResetRequest resetReq = new ForgotPasswordResetRequest();
        resetReq.setEmail(testEmail);
        resetReq.setOtp(testOtp);
        resetReq.setNewPassword(newPassword);
        resetReq.setConfirmPassword(newPassword);

        authenticationService.resetForgotPassword(resetReq);

        // Verify login with OLD password fails
        LoginRequest oldPasswordLogin = new LoginRequest();
        oldPasswordLogin.setEmail(testEmail);
        oldPasswordLogin.setPassword(initialPassword);
        Assertions.assertThrows(Exception.class, () -> {
            authenticationService.loginUser(oldPasswordLogin);
        }, "Login with old password should fail after reset");

        // Verify login with NEW password succeeds
        LoginRequest newPasswordLogin = new LoginRequest();
        newPasswordLogin.setEmail(testEmail);
        newPasswordLogin.setPassword(newPassword);

        AuthResponse resetLoginAuth = authenticationService.loginUser(newPasswordLogin);
        Assertions.assertNotNull(resetLoginAuth.getToken(), "Login with new password should succeed");

        System.out.println("=== INTEGRATION TEST PASSED: ALL SIGNUP & FORGOT PASSWORD FLOWS VERIFIED SUCCESSFULLY ===");
    }
}
