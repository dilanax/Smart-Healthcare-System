package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoConsultationRequest {

    @NotNull(message = "Doctor ID is required")
    private Long doctorId;

    @NotBlank(message = "Patient name is required")
    private String patientName;

    @NotBlank(message = "Patient email is required")
    @Email(message = "Patient email must be valid")
    private String patientEmail;

    @NotNull(message = "Consultation date is required")
    private LocalDate consultationDate;

    @NotNull(message = "Consultation time is required")
    private LocalTime consultationTime;

    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be positive")
    private Integer duration;

    @NotBlank(message = "Platform is required")
    private String platform;

    @NotBlank(message = "Meeting link is required")
    private String meetingLink;

    @NotBlank(message = "Category is required")
    private String category;

    private String notes;

    private String status;
}
