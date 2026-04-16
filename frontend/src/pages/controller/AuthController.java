package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
        if (!authService.isAdminTokenValid(extractBearerToken(authorizationHeader))) {
            return new ApiResponseDto("Unauthorized: invalid admin token", null);
        }
        return authService.getAllUsers();
    }

    @GetMapping("/user/{userId}")
    public ApiResponseDto getUserById(@RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                      @PathVariable Long userId) {
        if (!authService.isAdminTokenValid(extractBearerToken(authorizationHeader))) {
            return new ApiResponseDto("Unauthorized: invalid admin token", null);
        }
        return authService.getUserById(userId);
    }

    @PutMapping("/user/{userId}")
    public ApiResponseDto updateUser(@RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                     @PathVariable Long userId,
                                     @RequestBody UpdateUserRequestDto requestDto) {
        if (!authService.isAdminTokenValid(extractBearerToken(authorizationHeader))) {
            return new ApiResponseDto("Unauthorized: invalid admin token", null);
        }
        return authService.updateUser(userId, requestDto);
    }

    @DeleteMapping("/user/{userId}")
    public ApiResponseDto deleteUser(@RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                     @PathVariable Long userId) {
        if (!authService.isAdminTokenValid(extractBearerToken(authorizationHeader))) {
            return new ApiResponseDto("Unauthorized: invalid admin token", null);
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
