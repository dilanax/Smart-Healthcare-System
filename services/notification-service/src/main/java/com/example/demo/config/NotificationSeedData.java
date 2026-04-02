package com.example.demo.config;

import com.example.demo.entity.Notification;
import com.example.demo.entity.NotificationChannel;
import com.example.demo.entity.NotificationPriority;
import com.example.demo.entity.NotificationStatus;
import com.example.demo.repository.NotificationRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class NotificationSeedData {

    @Bean
    ApplicationRunner seedNotifications(NotificationRepository notificationRepository) {
        return args -> {
            if (notificationRepository.count() > 0) {
                return;
            }

            notificationRepository.saveAll(List.of(
                    Notification.builder()
                            .recipientName("Anjalie Fernando")
                            .recipientEmail("anjalie.fernando@email.com")
                            .recipientPhone("+94 77 333 1122")
                            .audienceType("PATIENT")
                            .relatedService("Appointment")
                            .subject("Appointment Reminder")
                            .message("Your cardiology consultation starts at 9:00 AM tomorrow.")
                            .templateCode("APPT_REMINDER")
                            .channel(NotificationChannel.EMAIL)
                            .priority(NotificationPriority.HIGH)
                            .status(NotificationStatus.QUEUED)
                            .scheduledAt(LocalDateTime.now().plusHours(4))
                            .build(),
                    Notification.builder()
                            .recipientName("Dr. Sadun Perera")
                            .recipientEmail("sadun.perera@smarthealth.lk")
                            .recipientPhone("+94 77 111 2233")
                            .audienceType("DOCTOR")
                            .relatedService("Doctor Management")
                            .subject("Credential Review Approved")
                            .message("Your doctor profile has been verified and activated.")
                            .templateCode("DOC_VERIFY")
                            .channel(NotificationChannel.IN_APP)
                            .priority(NotificationPriority.NORMAL)
                            .status(NotificationStatus.SENT)
                            .sentAt(LocalDateTime.now().minusHours(3))
                            .build(),
                    Notification.builder()
                            .recipientName("ICU Team")
                            .recipientEmail("icu@smarthealth.lk")
                            .recipientPhone("+94 11 777 2200")
                            .audienceType("INTERNAL")
                            .relatedService("Patient Monitoring")
                            .subject("Critical Patient Alert")
                            .message("Kasun Rajapaksha requires immediate respiratory follow-up.")
                            .templateCode("CRITICAL_ALERT")
                            .channel(NotificationChannel.SMS)
                            .priority(NotificationPriority.CRITICAL)
                            .status(NotificationStatus.FAILED)
                            .scheduledAt(LocalDateTime.now().minusMinutes(20))
                            .build()
            ));
        };
    }
}
