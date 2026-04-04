package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.VideoConsultationRequest;
import com.example.demo.dto.VideoConsultationResponse;
import com.example.demo.service.VideoConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/video-consultations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VideoConsultationController {

    private final VideoConsultationService consultationService;

    @PostMapping
    public ApiResponse<VideoConsultationResponse> createConsultation(@Valid @RequestBody VideoConsultationRequest request) {
        return ApiResponse.success("Video consultation created successfully.", consultationService.createConsultation(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<VideoConsultationResponse> getConsultation(@PathVariable Long id) {
        return ApiResponse.success("Video consultation loaded successfully.", consultationService.getConsultationById(id));
    }

    @GetMapping("/doctor/{doctorId}")
    public ApiResponse<List<VideoConsultationResponse>> getConsultationsByDoctor(@PathVariable Long doctorId) {
        return ApiResponse.success("Video consultations loaded successfully.", consultationService.getConsultationsByDoctorId(doctorId));
    }

    @GetMapping("/doctor/{doctorId}/scheduled")
    public ApiResponse<List<VideoConsultationResponse>> getScheduledConsultationsByDoctor(@PathVariable Long doctorId) {
        return ApiResponse.success("Scheduled video consultations loaded successfully.", consultationService.getScheduledConsultationsByDoctorId(doctorId));
    }

    @GetMapping("/doctor/{doctorId}/date")
    public ApiResponse<List<VideoConsultationResponse>> getConsultationsByDoctorAndDate(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Video consultations for the date loaded successfully.", consultationService.getConsultationsByDoctorIdAndDate(doctorId, date));
    }

    @GetMapping("/patient/{patientEmail}")
    public ApiResponse<List<VideoConsultationResponse>> getConsultationsByPatient(@PathVariable String patientEmail) {
        return ApiResponse.success("Patient video consultations loaded successfully.", consultationService.getConsultationsByPatientEmail(patientEmail));
    }

    @PutMapping("/{id}")
    public ApiResponse<VideoConsultationResponse> updateConsultation(
            @PathVariable Long id,
            @Valid @RequestBody VideoConsultationRequest request) {
        return ApiResponse.success("Video consultation updated successfully.", consultationService.updateConsultation(id, request));
    }

    @PutMapping("/{id}/meeting-link")
    public ApiResponse<VideoConsultationResponse> updateMeetingLink(
            @PathVariable Long id,
            @RequestParam String newLink) {
        return ApiResponse.success("Meeting link updated successfully.", consultationService.updateMeetingLink(id, newLink));
    }

    @PostMapping("/generate-link")
    public ApiResponse<String> generateMeetingLink(@RequestParam String platform) {
        return ApiResponse.success("Meeting link generated successfully.", consultationService.generateMeetingLink(platform));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteConsultation(@PathVariable Long id) {
        consultationService.deleteConsultation(id);
        return ApiResponse.success("Video consultation deleted successfully.", null);
    }
}
