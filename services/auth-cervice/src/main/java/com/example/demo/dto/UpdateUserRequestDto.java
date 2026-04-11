package com.example.demo.dto;

import com.example.demo.model.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequestDto {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    
    // New Profile Fields
    private Integer age;
    private String gender;
    private String profilePictureUrl;
    
    private Role role;
    private Boolean active;
}