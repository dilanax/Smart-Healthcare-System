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
}
