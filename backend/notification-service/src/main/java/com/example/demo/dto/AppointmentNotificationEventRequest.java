package com.example.demo.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentNotificationEventRequest {

    @NotBlank
    private String eventType;

    @NotNull
    private Long appointmentId;

    private LocalDateTime eventTime;

    private String details;

    @Valid
    @NotNull
    private NotificationPartyContact patient;

    @Valid
    @NotNull
    private NotificationPartyContact doctor;
}
