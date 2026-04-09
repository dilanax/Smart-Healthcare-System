package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repo.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.security.MessageDigest;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService, EmailService {

    private final UserRepository userRepository;
    private final JavaMailSender javaMailSender;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-hours:8}")
    private long jwtExpirationHours;

    @Override
    public ApiResponseDto register(RegisterRequestDto requestDto) {
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            return new ApiResponseDto("Email already exists", null);
        }

        Role role = requestDto.getRole() != null ? requestDto.getRole() : Role.PATIENT;
        String otp = generateOtp();

        User user = User.builder()
                .firstName(requestDto.getFirstName())
                .lastName(requestDto.getLastName())
                .email(requestDto.getEmail())
                .password(passwordEncoder.encode(requestDto.getPassword()))
                .phoneNumber(requestDto.getPhoneNumber())
                .role(role)
                .isActive(true)
                .otp(otp)
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .otpVerified(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        try {
            sendOtpEmail(user.getEmail(), otp);
            return new ApiResponseDto("User registered successfully. OTP sent to email.", null);
        } catch (Exception e) {
            return new ApiResponseDto("User registered, but OTP email failed: " + e.getMessage(), null);
        }
    }

    @Override
    public ApiResponseDto login(LoginRequestDto requestDto) {
        Optional<User> optionalUser = userRepository.findByEmail(requestDto.getEmail());

        if (optionalUser.isEmpty()) {
            return new ApiResponseDto("User not found", null);
        }

        User user = optionalUser.get();

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            return new ApiResponseDto("Invalid password", null);
        }

        if (!user.isActive()) {
            return new ApiResponseDto("Account is inactive", null);
        }

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        try {
            sendOtpEmail(user.getEmail(), otp);
        } catch (Exception e) {
            return new ApiResponseDto("OTP sending failed: " + e.getMessage(), null);
        }

        return new ApiResponseDto("OTP sent to your email. Please verify to complete login.", null);
    }

    @Override
    public ApiResponseDto verifyOtp(OtpVerifyRequestDto requestDto) {
        Optional<User> optionalUser = userRepository.findByEmail(requestDto.getEmail());

        if (optionalUser.isEmpty()) {
            return new ApiResponseDto("User not found", null);
        }

        User user = optionalUser.get();

        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            return new ApiResponseDto("No OTP found. Please request again.", null);
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            return new ApiResponseDto("OTP expired", null);
        }

        if (!user.getOtp().equals(requestDto.getOtp())) {
            return new ApiResponseDto("Invalid OTP", null);
        }

        user.setOtpVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return new ApiResponseDto("OTP verified successfully", buildLoginResponse(user));
    }

    @Override
    public ApiResponseDto getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> userList = new ArrayList<>();

        for (User user : users) {
            userList.add(buildUserResponse(user));
        }

        return new ApiResponseDto("Users fetched successfully", userList);
    }

    @Override
    public ApiResponseDto getUserById(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            return new ApiResponseDto("User not found", null);
        }

        return new ApiResponseDto("User fetched successfully", buildUserResponse(optionalUser.get()));
    }
@Override
public ApiResponseDto updateUser(Long userId, UpdateUserRequestDto requestDto) {
    return userRepository.findById(userId)
            .map(user -> {
                // Update text fields
                if (requestDto.getFirstName() != null) user.setFirstName(requestDto.getFirstName());
                if (requestDto.getLastName() != null) user.setLastName(requestDto.getLastName());
                if (requestDto.getPhoneNumber() != null) user.setPhoneNumber(requestDto.getPhoneNumber());
                if (requestDto.getAge() != null) user.setAge((Integer) requestDto.getAge());
                if (requestDto.getGender() != null) user.setGender(requestDto.getGender());
                
                // Update the image reference
                if (requestDto.getProfilePictureUrl() != null) {
                    user.setProfilePictureUrl((String) requestDto.getProfilePictureUrl());
                }
                
                userRepository.save(user);
                return new ApiResponseDto("Profile successfully synchronized", buildUserResponse(user));
            })
            .orElse(new ApiResponseDto("User record missing", null));
}

    @Override
    public ApiResponseDto deleteUser(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);

        if (optionalUser.isEmpty()) {
            return new ApiResponseDto("User not found", null);
        }

        userRepository.delete(optionalUser.get());
        return new ApiResponseDto("User deleted successfully", null);
    }

    @Override
    public boolean isAdminTokenValid(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            Map<String, Object> claims = getClaimsFromToken(token);
            Object role = claims.get("role");
            if (role == null || !"ADMIN".equalsIgnoreCase(String.valueOf(role))) return false;

            long expValue = ((Number) claims.get("exp")).longValue();
            return LocalDateTime.now().toEpochSecond(ZoneOffset.UTC) < expValue;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean isUserAuthorized(String token, Long requestedUserId) {
        if (token == null || token.isBlank() || token.equals("null")) {
            System.out.println("Auth Error: Token is null or empty");
            return false;
        }
        
        if (isAdminTokenValid(token)) return true;

        try {
            Map<String, Object> claims = getClaimsFromToken(token);
            Object idFromToken = claims.get("id");
            
            if (idFromToken == null) {
                System.out.println("Auth Error: Token does not contain an 'id' claim. User needs to log in again.");
                return false;
            }
            
            Long tokenId = Long.parseLong(String.valueOf(idFromToken));
            boolean isMatch = tokenId.equals(requestedUserId);
            
            if (!isMatch) {
                System.out.println("Auth Error: Token ID (" + tokenId + ") does not match requested ID (" + requestedUserId + ")");
            }
            
            return isMatch;
        } catch (Exception e) {
            System.out.println("Auth Error during token parsing: " + e.getMessage());
            return false;
        }
    }

    private Map<String, Object> getClaimsFromToken(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length != 3) throw new IllegalArgumentException("Invalid token format");
        
        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        return objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your OTP Code");
        message.setText("Your OTP is: " + otp + "\nThis OTP will expire in 5 minutes.");
        javaMailSender.send(message);
    }

    private String generateOtp() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    // 1. Rename generateAdminToken to generateJwtToken and use it for everyone
    private String generateJwtToken(User user) {
        try {
            long now = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);
            long exp = LocalDateTime.now().plusHours(jwtExpirationHours).toEpochSecond(ZoneOffset.UTC);
            
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");
            
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", user.getId());
            payload.put("email", user.getEmail());
            payload.put("role", user.getRole().name()); // Role is safely embedded here!
            payload.put("iat", now);
            payload.put("exp", exp);
            
            String h = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(header));
            String p = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(payload));
            return h + "." + p + "." + sign(h + "." + p);
        } catch (Exception e) {
            throw new IllegalStateException("JWT generation failed", e);
        }
    }

    // 2. Give the token to ALL users, not just Admins!
    private Map<String, Object> buildLoginResponse(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("email", user.getEmail());
        data.put("role", user.getRole());
        data.put("name", user.getFirstName() + " " + user.getLastName());
        
        // FIXED: Everyone gets an access token so they can access their own data
        data.put("accessToken", generateJwtToken(user));
        data.put("tokenType", "Bearer");
        
        return data;
    }
    private String sign(String content) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        sha256Hmac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(sha256Hmac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", user.getId());
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("email", user.getEmail());
        data.put("phoneNumber", user.getPhoneNumber());
        data.put("role", user.getRole());
        data.put("active", user.isActive());
        data.put("otpVerified", user.isOtpVerified());
        data.put("createdAt", user.getCreatedAt());
        data.put("updatedAt", user.getUpdatedAt());
        return data;
    }
}