package com.example.demo.service;

import com.example.demo.dto.NotificationRequest;
import com.example.demo.dto.NotificationReplyRequest;
import com.example.demo.dto.NotificationStatusUpdateRequest;
import com.example.demo.dto.NotificationSummaryResponse;
import com.example.demo.entity.Notification;
import com.example.demo.entity.NotificationPriority;
import com.example.demo.entity.NotificationStatus;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    @Override
    public Notification getNotificationById(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id " + notificationId));
    }

    @Override
    public Notification createNotification(NotificationRequest request) {
        Notification notification = Notification.builder().build();
        mapRequest(notification, request);
        if (notification.getStatus() == NotificationStatus.SENT && notification.getSentAt() == null) {
            notification.setSentAt(LocalDateTime.now());
        }
        return notificationRepository.save(notification);
    }

    @Override
    public Notification updateNotification(Long notificationId, NotificationRequest request) {
        Notification notification = getNotificationById(notificationId);
        mapRequest(notification, request);
        if (notification.getStatus() != NotificationStatus.SENT) {
            notification.setSentAt(null);
        }
        return notificationRepository.save(notification);
    }

    @Override
    public Notification updateStatus(Long notificationId, NotificationStatusUpdateRequest request) {
        Notification notification = getNotificationById(notificationId);
        notification.setStatus(request.getStatus());
        notification.setSentAt(request.getStatus() == NotificationStatus.SENT ? LocalDateTime.now() : null);
        return notificationRepository.save(notification);
    }

    @Override
    public Notification replyToNotification(Long notificationId, NotificationReplyRequest request) {
        Notification notification = getNotificationById(notificationId);
        notification.setReplyMessage(request.getReplyMessage().trim());
        notification.setRepliedByName(request.getRepliedByName().trim());
        notification.setRepliedByEmail(request.getRepliedByEmail().trim().toLowerCase());
        notification.setRepliedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Override
    public Notification sendNotification(Long notificationId) {
        Notification notification = getNotificationById(notificationId);
        notification.setStatus(NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Override
    public void deleteNotification(Long notificationId) {
        notificationRepository.delete(getNotificationById(notificationId));
    }

    @Override
    public NotificationSummaryResponse getSummary() {
        return NotificationSummaryResponse.builder()
                .totalNotifications(notificationRepository.count())
                .queuedNotifications(notificationRepository.countByStatus(NotificationStatus.QUEUED))
                .sentNotifications(notificationRepository.countByStatus(NotificationStatus.SENT))
                .failedNotifications(notificationRepository.countByStatus(NotificationStatus.FAILED))
                .criticalNotifications(notificationRepository.countByPriority(NotificationPriority.CRITICAL))
                .build();
    }

    private void mapRequest(Notification notification, NotificationRequest request) {
        notification.setRecipientName(request.getRecipientName().trim());
        notification.setRecipientEmail(request.getRecipientEmail() == null ? null : request.getRecipientEmail().trim().toLowerCase());
        notification.setRecipientPhone(request.getRecipientPhone() == null ? null : request.getRecipientPhone().trim());
        notification.setAudienceType(request.getAudienceType().trim());
        notification.setRelatedService(request.getRelatedService().trim());
        notification.setSubject(request.getSubject().trim());
        notification.setMessage(request.getMessage().trim());
        notification.setTemplateCode(request.getTemplateCode().trim().toUpperCase());
        notification.setChannel(request.getChannel());
        notification.setPriority(request.getPriority());
        notification.setStatus(request.getStatus());
        notification.setScheduledAt(request.getScheduledAt());
        notification.setSentAt(request.getStatus() == NotificationStatus.SENT ? LocalDateTime.now() : null);
    }
}
