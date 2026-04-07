package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String dateOfBirth;

    private String gender; // MALE, FEMALE, OTHER

    private String address;

    private String city;

    private String state;

    private String zipCode;

    private String country;

    private String emergencyContactName;

    private String emergencyContactRelationship;

    private String emergencyContactPhone;

    private String bloodType;

    private Double height; // in cm

    private Double weight; // in kg

    private String allergies;

    private String chronicDiseases;

    private String previousSurgeries;

    private String currentMedications;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
