package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "video_consultations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoConsultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private String patientName;

    @Column(nullable = false)
    private String patientEmail;

    @Column(nullable = false)
    private LocalDate consultationDate;

    @Column(nullable = false)
    private LocalTime consultationTime;

    @Column(nullable = false)
    private Integer duration; // in minutes

    @Column(nullable = false)
    private String platform; // Google Meet, Zoom, Microsoft Teams, SmartCare Video

    @Column(nullable = false, length = 500)
    private String meetingLink;

    @Column(nullable = false)
    private String category; // General Consultation, Follow-up, Emergency, etc.

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private String status; // Scheduled, In Progress, Completed, Cancelled

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "Scheduled";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
