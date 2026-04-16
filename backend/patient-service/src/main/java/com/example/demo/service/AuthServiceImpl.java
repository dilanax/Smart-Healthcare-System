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
        if (optionalUser.isEmpty()) return new ApiResponseDto("User not found", null);
        User user = optionalUser.get();
        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            return new ApiResponseDto("Invalid password", null);
        }
        if (!user.isActive()) return new ApiResponseDto("Account is inactive", null);
        
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
        if (optionalUser.isEmpty()) return new ApiResponseDto("User not found", null);
        User user = optionalUser.get();
        if (user.getOtp() == null || user.getOtpExpiry() == null) {
            return new ApiResponseDto("No OTP found. Please request again.", null);
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) return new ApiResponseDto("OTP expired", null);
        if (!user.getOtp().equals(requestDto.getOtp())) return new ApiResponseDto("Invalid OTP", null);
        
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
        for (User user : users) userList.add(buildUserResponse(user));
        return new ApiResponseDto("Users fetched successfully", userList);
    }

    @Override
    public ApiResponseDto getUserById(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) return new ApiResponseDto("User not found", null);
        return new ApiResponseDto("User fetched successfully", buildUserResponse(optionalUser.get()));
    }

    @Override
    public ApiResponseDto updateUser(Long userId, UpdateUserRequestDto requestDto) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) return new ApiResponseDto("User not found", null);

        User user = optionalUser.get();
        boolean emailChanged = false;
        String updateMessage = "User updated successfully";

        String requestedEmail = requestDto.getEmail();
        if (requestedEmail != null) {
            requestedEmail = requestedEmail.trim().toLowerCase();
            if (requestedEmail.isBlank()) requestedEmail = null;
        }

        if (requestedEmail != null && !requestedEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(requestedEmail)) {
            return new ApiResponseDto("Email already exists", null);
        }

        if (requestDto.getFirstName() != null) user.setFirstName(requestDto.getFirstName());
        if (requestDto.getLastName() != null) user.setLastName(requestDto.getLastName());
        
        if (requestedEmail != null && !requestedEmail.equalsIgnoreCase(user.getEmail())) {
            user.setEmail(requestedEmail);
            user.setOtpVerified(false);
            String otp = generateOtp();
            user.setOtp(otp);
            user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
            emailChanged = true;
            updateMessage = "User updated successfully. New email must be verified with OTP.";
        }
        if (requestDto.getPassword() != null && !requestDto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(requestDto.getPassword()));
        }
        
        // 🚨 THESE FIELDS WILL NOW SAVE TO THE DATABASE 🚨
        if (requestDto.getPhoneNumber() != null) user.setPhoneNumber(requestDto.getPhoneNumber());
        if (requestDto.getAge() != null) user.setAge(requestDto.getAge());
        if (requestDto.getGender() != null) user.setGender(requestDto.getGender());
        
        if (requestDto.getRole() != null) user.setRole(requestDto.getRole());
        if (requestDto.getActive() != null) user.setActive(requestDto.getActive());

        User updatedUser = userRepository.save(user);

        if (emailChanged) {
            try {
                sendOtpEmail(updatedUser.getEmail(), updatedUser.getOtp());
            } catch (Exception e) {
                updateMessage = "User updated, but OTP email failed: " + e.getMessage();
            }
        }

        return new ApiResponseDto(updateMessage, buildUserResponse(updatedUser));
    }

    @Override
    public ApiResponseDto deleteUser(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) return new ApiResponseDto("User not found", null);
        userRepository.delete(optionalUser.get());
        return new ApiResponseDto("User deleted successfully", null);
    }

    @Override
    public boolean isAdminTokenValid(String token) {
        if (token == null || token.isBlank()) return false;
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return false;
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> claims = objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
            String expectedSignature = sign(parts[0] + "." + parts[1]);
            if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8))) return false;
            Object role = claims.get("role");
            if (role == null || !"ADMIN".equalsIgnoreCase(String.valueOf(role))) return false;
            Object exp = claims.get("exp");
            if (exp == null) return false;
            long expValue = ((Number) exp).longValue();
            long now = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);
            return now < expValue;
        } catch (Exception e) {
            return false;
        }
    }
    // 🚨 PASTE THIS NEW METHOD JUST ABOVE sendOtpEmail() 🚨
    @Override
    public boolean isUserOrAdminTokenValid(String token, Long targetUserId) {
        if (token == null || token.isBlank()) {
            return false;
        }

        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Map<String, Object> claims = objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});

            String expectedSignature = sign(parts[0] + "." + parts[1]);
            if (!MessageDigest.isEqual(expectedSignature.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            Object exp = claims.get("exp");
            if (exp == null) return false;
            long expValue = ((Number) exp).longValue();
            long now = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);
            if (now >= expValue) return false;

            Object role = claims.get("role");
            Object tokenId = claims.get("id");

            // Allow if Admin OR if the Token ID matches the Profile ID being edited
            if ("ADMIN".equalsIgnoreCase(String.valueOf(role))) {
                return true;
            }
            if (tokenId != null && Long.valueOf(String.valueOf(tokenId)).equals(targetUserId)) {
                return true;
            }

            return false;
        } catch (Exception e) {
            return false;
        }
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
        Random random = new Random();
        int otpNumber = 100000 + random.nextInt(900000);
        return String.valueOf(otpNumber);
    }

    private String generateAdminToken(User user) {
        try {
            long issuedAt = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);
            long expiresAt = LocalDateTime.now().plusHours(jwtExpirationHours).toEpochSecond(ZoneOffset.UTC);
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("id", user.getId());
            payload.put("email", user.getEmail());
            payload.put("role", user.getRole().name());
            payload.put("iat", issuedAt);
            payload.put("exp", expiresAt);
            String encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(header));
            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(objectMapper.writeValueAsBytes(payload));
            String signature = sign(encodedHeader + "." + encodedPayload);
            return encodedHeader + "." + encodedPayload + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate JWT token", e);
        }
    }

    private String sign(String content) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] signedBytes = sha256Hmac.doFinal(content.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(signedBytes);
    }

    private Map<String, Object> buildLoginResponse(User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("email", user.getEmail());
        data.put("role", user.getRole());
        data.put("name", user.getFirstName() + " " + user.getLastName());
        if (user.getRole() == Role.ADMIN) {
            data.put("accessToken", generateAdminToken(user));
            data.put("tokenType", "Bearer");
        }
        return data;
    }

    private Map<String, Object> buildUserResponse(User user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", user.getId());
        data.put("firstName", user.getFirstName());
        data.put("lastName", user.getLastName());
        data.put("email", user.getEmail());
        
        // 🚨 THESE WILL NOW BE SENT TO THE REACT UI 🚨
        data.put("phoneNumber", user.getPhoneNumber());
        data.put("age", user.getAge());
        data.put("gender", user.getGender());
        
        data.put("role", user.getRole());
        data.put("active", user.isActive());
        data.put("otpVerified", user.isOtpVerified());
        data.put("createdAt", user.getCreatedAt());
        data.put("updatedAt", user.getUpdatedAt());
        return data;
    }
}