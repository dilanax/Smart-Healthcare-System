package com.example.demo.dto;

import com.example.demo.model.NotificationChannel;
import com.example.demo.model.NotificationPriority;
import com.example.demo.model.NotificationStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {

    @NotBlank
    private String recipientName;

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

    private NotificationChannel channel;
    private NotificationPriority priority;
    private NotificationStatus status;
    private LocalDateTime scheduledAt;
}
