package com.example.demo.dto;

import com.example.demo.entity.PatientStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PatientRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phoneNumber;

    @NotNull
    private LocalDate dateOfBirth;

    @NotBlank
    private String gender;

    @NotBlank
    private String bloodGroup;

    private List<String> medicalConditions;

    @NotBlank
    private String emergencyContactName;

    @NotBlank
    private String emergencyContactPhone;

    @NotBlank
    private String assignedDoctor;

    @NotBlank
    private String address;

    @NotNull
    private PatientStatus status;
}
