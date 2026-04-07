package com.example.demo.service;

import com.example.demo.dto.VideoConsultationRequest;
import com.example.demo.dto.VideoConsultationResponse;
import com.example.demo.entity.VideoConsultation;

import java.time.LocalDate;
import java.util.List;

public interface VideoConsultationService {

    VideoConsultationResponse createConsultation(VideoConsultationRequest request);

    VideoConsultationResponse getConsultationById(Long id);

    List<VideoConsultationResponse> getConsultationsByDoctorId(Long doctorId);

    List<VideoConsultationResponse> getConsultationsByPatientEmail(String patientEmail);

    VideoConsultationResponse updateConsultation(Long id, VideoConsultationRequest request);

    VideoConsultationResponse updateMeetingLink(Long id, String newLink);

    String generateMeetingLink(String platform);

    void deleteConsultation(Long id);

    List<VideoConsultationResponse> getScheduledConsultationsByDoctorId(Long doctorId);

    List<VideoConsultationResponse> getConsultationsByDoctorIdAndDate(Long doctorId, LocalDate date);
}
