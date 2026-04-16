package com.example.demo.service;

import com.example.demo.dto.AppointmentNotificationEventRequest;
import com.example.demo.dto.NotificationRequest;
import com.example.demo.dto.NotificationReplyRequest;
import com.example.demo.dto.NotificationStatusUpdateRequest;
import com.example.demo.dto.NotificationSummaryResponse;
import com.example.demo.model.Notification;

import java.util.List;

public interface NotificationService {

    List<Notification> getAllNotifications();

    Notification getNotificationById(Long notificationId);

    Notification createNotification(NotificationRequest request);

    Notification updateNotification(Long notificationId, NotificationRequest request);

    Notification updateStatus(Long notificationId, NotificationStatusUpdateRequest request);

    Notification replyToNotification(Long notificationId, NotificationReplyRequest request);

    Notification sendNotification(Long notificationId);

    List<Notification> sendAppointmentOrConsultationConfirmation(AppointmentNotificationEventRequest request);

    void deleteNotification(Long notificationId);

    NotificationSummaryResponse getSummary();
}
