package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoConsultationResponse {

    private Long id;

    private Long doctorId;

    private String doctorName;

    private String patientName;

    private String patientEmail;

    private LocalDate consultationDate;

    private LocalTime consultationTime;

    private Integer duration;

    private String platform;

    private String meetingLink;

    private String category;

    private String notes;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
