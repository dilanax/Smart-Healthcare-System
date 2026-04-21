package com.example.demo.service;

import com.example.demo.dto.AppointmentNotificationEventRequest;
import com.example.demo.dto.NotificationPartyContact;
import com.example.demo.dto.NotificationReadStatusUpdateRequest;
import com.example.demo.dto.NotificationRequest;
import com.example.demo.dto.NotificationReplyRequest;
import com.example.demo.dto.NotificationStatusUpdateRequest;
import com.example.demo.dto.NotificationSummaryResponse;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Notification;
import com.example.demo.model.NotificationChannel;
import com.example.demo.model.NotificationPriority;
import com.example.demo.model.NotificationStatus;
import com.example.demo.repo.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${sms.twilio.base-url:https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json}")
    private String smsApiBaseUrl;

    @Value("${sms.twilio.account-sid:}")
    private String smsAccountSid;

    @Value("${sms.twilio.auth-token:}")
    private String smsAuthToken;

    @Value("${sms.twilio.from-number:}")
    private String smsFromNumber;

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
    public Notification updateReadStatus(Long notificationId, NotificationReadStatusUpdateRequest request) {
        Notification notification = getNotificationById(notificationId);
        boolean isRead = Boolean.TRUE.equals(request.getRead());
        notification.setRead(isRead);
        notification.setReadAt(isRead ? LocalDateTime.now() : null);
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
        return dispatchNotification(notification);
    }

    @Override
    public List<Notification> sendAppointmentOrConsultationConfirmation(AppointmentNotificationEventRequest request) {
        validateContactChannels(request.getPatient(), "patient");
        validateContactChannels(request.getDoctor(), "doctor");

        String subject = buildEventSubject(request);
        String message = buildEventMessage(request);

        List<Notification> sent = new ArrayList<>();
        sent.add(createAndDispatchForContact(request, request.getPatient(), "PATIENT", subject, message, NotificationChannel.EMAIL));
        sent.add(createAndDispatchForContact(request, request.getPatient(), "PATIENT", subject, message, NotificationChannel.SMS));
        sent.add(createAndDispatchForContact(request, request.getDoctor(), "DOCTOR", subject, message, NotificationChannel.EMAIL));
        sent.add(createAndDispatchForContact(request, request.getDoctor(), "DOCTOR", subject, message, NotificationChannel.SMS));
        return sent;
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
        notification.setChannel(request.getChannel() == null ? NotificationChannel.EMAIL : request.getChannel());
        notification.setPriority(request.getPriority() == null ? NotificationPriority.NORMAL : request.getPriority());
        notification.setStatus(request.getStatus() == null ? NotificationStatus.QUEUED : request.getStatus());
        notification.setScheduledAt(request.getScheduledAt());
        notification.setSentAt(request.getStatus() == NotificationStatus.SENT ? LocalDateTime.now() : null);
        notification.setRead(Boolean.TRUE.equals(notification.getRead()));
        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setReadAt(null);
        }
    }

    private Notification createAndDispatchForContact(AppointmentNotificationEventRequest request,
                                                     NotificationPartyContact contact,
                                                     String audienceType,
                                                     String subject,
                                                     String message,
                                                     NotificationChannel channel) {
        Notification notification = Notification.builder()
                .recipientName(contact.getName().trim())
                .recipientEmail(contact.getEmail() == null ? null : contact.getEmail().trim().toLowerCase())
                .recipientPhone(contact.getPhone() == null ? null : contact.getPhone().trim())
                .audienceType(audienceType)
                .relatedService("APPOINTMENT")
                .subject(subject)
                .message(message)
                .templateCode(normalizeEventType(request.getEventType()))
                .channel(channel)
                .priority(NotificationPriority.HIGH)
                .status(NotificationStatus.QUEUED)
                .read(false)
                .scheduledAt(request.getEventTime())
                .build();

        Notification saved = notificationRepository.save(notification);
        return dispatchNotification(saved);
    }

    private Notification dispatchNotification(Notification notification) {
        try {
            if (notification.getChannel() == NotificationChannel.EMAIL) {
                sendViaEmail(notification);
            } else if (notification.getChannel() == NotificationChannel.SMS) {
                sendViaSms(notification);
            }

            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
        } catch (Exception ex) {
            notification.setStatus(NotificationStatus.FAILED);
            notification.setReplyMessage("Delivery error: " + ex.getMessage());
        }

        return notificationRepository.save(notification);
    }

    private void sendViaEmail(Notification notification) throws Exception {
        if (!StringUtils.hasText(notification.getRecipientEmail())) {
            throw new IllegalArgumentException("Recipient email is required for email notifications.");
        }
        if (!StringUtils.hasText(mailFrom)) {
            throw new IllegalStateException("Email sender is not configured.");
        }

        var mimeMessage = javaMailSender.createMimeMessage();
        var helper = new MimeMessageHelper(mimeMessage, false, StandardCharsets.UTF_8.name());
        helper.setFrom(mailFrom);
        helper.setTo(notification.getRecipientEmail());
        helper.setSubject(notification.getSubject());
        helper.setText(notification.getMessage(), false);
        javaMailSender.send(mimeMessage);
    }

    private void sendViaSms(Notification notification) throws Exception {
        if (!StringUtils.hasText(notification.getRecipientPhone())) {
            throw new IllegalArgumentException("Recipient phone is required for SMS notifications.");
        }
        if (!StringUtils.hasText(smsAccountSid)
                || !StringUtils.hasText(smsAuthToken)
                || !StringUtils.hasText(smsFromNumber)) {
            throw new IllegalStateException("Twilio SMS credentials are missing.");
        }

        String endpoint = smsApiBaseUrl.replace("{accountSid}", smsAccountSid);
        String form = "To=" + encode(notification.getRecipientPhone())
                + "&From=" + encode(smsFromNumber)
                + "&Body=" + encode(notification.getMessage());

        String authToken = Base64.getEncoder()
                .encodeToString((smsAccountSid + ":" + smsAuthToken).getBytes(StandardCharsets.UTF_8));

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Authorization", "Basic " + authToken)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient().send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("SMS provider rejected request with status " + response.statusCode());
        }
    }

    private String buildEventSubject(AppointmentNotificationEventRequest request) {
        String type = normalizeEventType(request.getEventType());
        if ("CONSULTATION_COMPLETED".equals(type)) {
            return "Consultation completed - confirmation";
        }
        return "Appointment booking confirmed";
    }

    private String buildEventMessage(AppointmentNotificationEventRequest request) {
        String type = normalizeEventType(request.getEventType());
        String timestamp = request.getEventTime() == null ? LocalDateTime.now().toString() : request.getEventTime().toString();
        String details = StringUtils.hasText(request.getDetails()) ? request.getDetails().trim() : "No additional details.";

        if ("CONSULTATION_COMPLETED".equals(type)) {
            return "Your consultation is completed. Appointment ID: " + request.getAppointmentId()
                    + ". Completed at: " + timestamp + ". Details: " + details;
        }
        return "Your appointment booking is confirmed. Appointment ID: " + request.getAppointmentId()
                + ". Confirmed at: " + timestamp + ". Details: " + details;
    }

    private String normalizeEventType(String eventType) {
        return eventType == null ? "APPOINTMENT_BOOKED" : eventType.trim().toUpperCase();
    }

    private void validateContactChannels(NotificationPartyContact contact, String role) {
        if (!StringUtils.hasText(contact.getEmail())) {
            throw new IllegalArgumentException("Missing email for " + role + ".");
        }
        if (!StringUtils.hasText(contact.getPhone())) {
            throw new IllegalArgumentException("Missing phone for " + role + ".");
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
