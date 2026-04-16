package com.example.demo.dto;

import com.example.demo.model.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRequestDto {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private Role role;
    private Boolean active;
    
    // 🚨 THESE TWO MUST BE HERE TO RECEIVE DATA FROM REACT 🚨
    private Integer age;
    private String gender;
}