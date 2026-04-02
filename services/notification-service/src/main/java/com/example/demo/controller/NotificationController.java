package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.NotificationRequest;
import com.example.demo.dto.NotificationStatusUpdateRequest;
import com.example.demo.dto.NotificationSummaryResponse;
import com.example.demo.entity.Notification;
import com.example.demo.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<Notification>> getNotifications() {
        return ApiResponse.success("Notifications loaded successfully.", notificationService.getAllNotifications());
    }

    @GetMapping("/summary")
    public ApiResponse<NotificationSummaryResponse> getSummary() {
        return ApiResponse.success("Notification summary loaded successfully.", notificationService.getSummary());
    }

    @GetMapping("/{notificationId}")
    public ApiResponse<Notification> getNotification(@PathVariable Long notificationId) {
        return ApiResponse.success("Notification loaded successfully.", notificationService.getNotificationById(notificationId));
    }

    @PostMapping
    public ApiResponse<Notification> createNotification(@Valid @RequestBody NotificationRequest request) {
        return ApiResponse.success("Notification created successfully.", notificationService.createNotification(request));
    }

    @PutMapping("/{notificationId}")
    public ApiResponse<Notification> updateNotification(@PathVariable Long notificationId,
                                                        @Valid @RequestBody NotificationRequest request) {
        return ApiResponse.success("Notification updated successfully.", notificationService.updateNotification(notificationId, request));
    }

    @PatchMapping("/{notificationId}/status")
    public ApiResponse<Notification> updateStatus(@PathVariable Long notificationId,
                                                  @Valid @RequestBody NotificationStatusUpdateRequest request) {
        return ApiResponse.success("Notification status updated successfully.", notificationService.updateStatus(notificationId, request));
    }

    @PostMapping("/{notificationId}/send")
    public ApiResponse<Notification> sendNotification(@PathVariable Long notificationId) {
        return ApiResponse.success("Notification dispatched successfully.", notificationService.sendNotification(notificationId));
    }

    @DeleteMapping("/{notificationId}")
    public ApiResponse<Void> deleteNotification(@PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ApiResponse.success("Notification removed successfully.", null);
    }
}
