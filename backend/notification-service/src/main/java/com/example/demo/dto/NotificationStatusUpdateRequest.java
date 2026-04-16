package com.example.demo.dto;

import com.example.demo.model.NotificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationStatusUpdateRequest {

    @NotNull
    private NotificationStatus status;
}
