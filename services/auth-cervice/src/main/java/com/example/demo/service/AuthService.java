package com.example.demo.service;

import com.example.demo.dto.*;

public interface AuthService {
    ApiResponseDto register(RegisterRequestDto requestDto);
    ApiResponseDto login(LoginRequestDto requestDto);
    ApiResponseDto verifyOtp(OtpVerifyRequestDto requestDto);
    ApiResponseDto getAllUsers();
    ApiResponseDto getUserById(Long userId);
    ApiResponseDto updateUser(Long userId, UpdateUserRequestDto requestDto);
    ApiResponseDto updateUserProfile(Long userId, UserProfileUpdateDto requestDto);
    ApiResponseDto deleteUser(Long userId);
    boolean isAdminTokenValid(String token);
}
