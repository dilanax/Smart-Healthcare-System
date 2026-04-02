package com.example.demo.dto;

import com.example.demo.entity.NotificationChannel;
import com.example.demo.entity.NotificationPriority;
import com.example.demo.entity.NotificationStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationRequest {

    @NotBlank
    private String recipientName;

    @Email
    private String recipientEmail;

    private String recipientPhone;

    @NotBlank
    private String audienceType;

    @NotBlank
    private String relatedService;

    @NotBlank
    private String subject;

    @NotBlank
    private String message;

    @NotBlank
    private String templateCode;

    @NotNull
    private NotificationChannel channel;

    @NotNull
    private NotificationPriority priority;

    @NotNull
    private NotificationStatus status;

    private LocalDateTime scheduledAt;
}
