package com.example.demo.repository;

import com.example.demo.entity.Notification;
import com.example.demo.entity.NotificationPriority;
import com.example.demo.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    long countByStatus(NotificationStatus status);

    long countByPriority(NotificationPriority priority);
}
