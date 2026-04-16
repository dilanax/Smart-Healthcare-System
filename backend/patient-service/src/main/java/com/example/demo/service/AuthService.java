package com.example.demo.service;

import com.example.demo.dto.ApiResponseDto;
import com.example.demo.dto.LoginRequestDto;
import com.example.demo.dto.OtpVerifyRequestDto;
import com.example.demo.dto.RegisterRequestDto;
import com.example.demo.dto.UpdateUserRequestDto;

public interface AuthService {
    ApiResponseDto register(RegisterRequestDto requestDto);
    ApiResponseDto login(LoginRequestDto requestDto);
    ApiResponseDto verifyOtp(OtpVerifyRequestDto requestDto);
    ApiResponseDto getAllUsers();
    ApiResponseDto getUserById(Long userId);
    ApiResponseDto updateUser(Long userId, UpdateUserRequestDto requestDto);
    ApiResponseDto deleteUser(Long userId);
    boolean isUserOrAdminTokenValid(String token, Long targetUserId);
    boolean isAdminTokenValid(String token);
}
