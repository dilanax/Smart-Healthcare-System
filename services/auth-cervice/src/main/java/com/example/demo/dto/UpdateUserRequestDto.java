package com.example.demo.dto;

import com.example.demo.model.Role;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequestDto {
    private String firstName;
    private String lastName;
    private String email;
    
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;
    private String phoneNumber;
    private Role role;
    private Boolean active;
}
