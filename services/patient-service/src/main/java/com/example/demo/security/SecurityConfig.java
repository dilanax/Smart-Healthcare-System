package com.example.demo.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Disable CSRF (Cross-Site Request Forgery) for REST APIs
            .csrf(csrf -> csrf.disable()) 
            
            // 2. Configure which endpoints are public and which are secured
            .authorizeHttpRequests(auth -> auth
                // Allow public access to auth endpoints (login, register, verify-otp)
                .requestMatchers("/api/auth/**").permitAll() 
                
                // IMPORTANT FIX: Whitelist the /error endpoint so Spring can return actual error messages (like 400 Bad Request) instead of throwing a 403 Forbidden
                .requestMatchers("/error").permitAll() 
                
                // All other requests must be authenticated (require a JWT)
                .anyRequest().authenticated()
            )
            
            // 3. Set session management to stateless (JWTs don't use sessions)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        // 4. Add your custom JWT filter before the standard authentication filter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}