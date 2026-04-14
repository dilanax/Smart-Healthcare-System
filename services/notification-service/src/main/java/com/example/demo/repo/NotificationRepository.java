package com.example.demo.repo;

import com.example.demo.model.Notification;
import com.example.demo.model.NotificationPriority;
import com.example.demo.model.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    long countByStatus(NotificationStatus status);

    long countByPriority(NotificationPriority priority);
}
