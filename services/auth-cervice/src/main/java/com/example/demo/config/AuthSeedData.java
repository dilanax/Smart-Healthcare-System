package com.example.demo.config;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repo.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class AuthSeedData {

    @Bean
    ApplicationRunner seedAdminUser(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.existsByEmail("admin@smarthealth.lk")) {
                return;
            }

            User admin = User.builder()
                    .firstName("System")
                    .lastName("Administrator")
                    .email("admin@smarthealth.lk")
                    .password(passwordEncoder.encode("Admin@123"))
                    .phoneNumber("+94 11 700 5000")
                    .role(Role.ADMIN)
                    .isActive(true)
                    .otpVerified(true)
                    .build();

            userRepository.save(admin);
        };
    }
}
