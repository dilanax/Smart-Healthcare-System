package com.example.demo.dto;

import lombok.Data;

@Data
public class UserProfileUpdateDto {
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profilePhoto;
}
