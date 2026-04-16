package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSummaryResponse {

    private long totalNotifications;
    private long queuedNotifications;
    private long sentNotifications;
    private long failedNotifications;
    private long criticalNotifications;
}
