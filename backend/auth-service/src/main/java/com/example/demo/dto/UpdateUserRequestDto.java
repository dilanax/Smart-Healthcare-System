package com.example.demo.dto;

import com.example.demo.model.Role;

import lombok.Data;

@Data
public class UpdateUserRequestDto {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private Role role;
    private Boolean active;
    
    // 🚨 ADDED: These are the missing fields that caused the data to be thrown away!
    private Integer age;
    private String gender;
}