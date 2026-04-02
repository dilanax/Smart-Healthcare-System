package com.example.demo.dto;

import com.example.demo.entity.NotificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationStatusUpdateRequest {

    @NotNull
    private NotificationStatus status;
}
