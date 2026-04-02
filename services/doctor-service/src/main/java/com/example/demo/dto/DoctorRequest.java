package com.example.demo.dto;

import com.example.demo.entity.DoctorStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class DoctorRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phoneNumber;

    @NotBlank
    private String specialization;

    @NotBlank
    private String licenseNumber;

    @NotBlank
    private String department;

    @NotBlank
    private String roomNumber;

    @NotNull
    @Min(0)
    private Integer experienceYears;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal consultationFee;

    @NotNull
    private DoctorStatus status;

    private Boolean verified;

    @NotEmpty
    private List<String> availableDays;

    private String biography;
}
