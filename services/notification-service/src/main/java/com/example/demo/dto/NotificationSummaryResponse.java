package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationSummaryResponse {

    private long totalNotifications;
    private long queuedNotifications;
    private long sentNotifications;
    private long failedNotifications;
    private long criticalNotifications;
}
