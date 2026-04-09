package com.example.demo.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ApiResponseDto;
import com.example.demo.dto.LoginRequestDto;
import com.example.demo.dto.OtpVerifyRequestDto;
import com.example.demo.dto.RegisterRequestDto;
import com.example.demo.dto.UpdateUserRequestDto;
import com.example.demo.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponseDto register(@Valid @RequestBody RegisterRequestDto requestDto) {
        return authService.register(requestDto);
    }

    @PostMapping("/login")
    public ApiResponseDto login(@Valid @RequestBody LoginRequestDto requestDto) {
        return authService.login(requestDto);
    }

    @PostMapping("/verify-otp")
    public ApiResponseDto verifyOtp(@RequestBody OtpVerifyRequestDto requestDto) {
        return authService.verifyOtp(requestDto);
    }

    @GetMapping("/users")
    public ApiResponseDto getAllUsers(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        // Only Admins can get ALL users
        if (!authService.isAdminTokenValid(extractBearerToken(authorizationHeader))) {
            return new ApiResponseDto("Unauthorized: invalid admin token", null);
        }
        return authService.getAllUsers();
    }

    @GetMapping("/user/{userId}")
    public ApiResponseDto getUserById(@RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                      @PathVariable Long userId) {
        String token = extractBearerToken(authorizationHeader);
        // FIXED: Allow the user to view their own profile
        if (!authService.isUserAuthorized(token, userId)) {
            return new ApiResponseDto("Unauthorized: Access denied", null);
        }
        return authService.getUserById(userId);
    }

    @PutMapping("/user/{userId}")
    public ApiResponseDto updateUser(@RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                     @PathVariable Long userId,
                                     @RequestBody UpdateUserRequestDto requestDto) {
        String token = extractBearerToken(authorizationHeader);
        // FIXED: Allow the user to update their own profile
        if (!authService.isUserAuthorized(token, userId)) {
            return new ApiResponseDto("Unauthorized: Access denied", null);
        }
        return authService.updateUser(userId, requestDto);
    }

    @DeleteMapping("/user/{userId}")
    public ApiResponseDto deleteUser(@RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                     @PathVariable Long userId) {
        String token = extractBearerToken(authorizationHeader);
        // FIXED: Allow the user to delete their own profile
        if (!authService.isUserAuthorized(token, userId)) {
            return new ApiResponseDto("Unauthorized: Access denied", null);
        }
        return authService.deleteUser(userId);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        return authorizationHeader.substring(7);
    }
}