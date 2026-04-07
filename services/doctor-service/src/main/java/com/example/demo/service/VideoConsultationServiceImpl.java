package com.example.demo.service;

import com.example.demo.dto.VideoConsultationRequest;
import com.example.demo.dto.VideoConsultationResponse;
import com.example.demo.entity.Doctor;
import com.example.demo.entity.VideoConsultation;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DoctorRepository;
import com.example.demo.repository.VideoConsultationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VideoConsultationServiceImpl implements VideoConsultationService {

    private final VideoConsultationRepository consultationRepository;
    private final DoctorRepository doctorRepository;

    @Override
    public VideoConsultationResponse createConsultation(VideoConsultationRequest request) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id " + request.getDoctorId()));

        VideoConsultation consultation = VideoConsultation.builder()
                .doctor(doctor)
                .patientName(request.getPatientName())
                .patientEmail(request.getPatientEmail().toLowerCase())
                .consultationDate(request.getConsultationDate())
                .consultationTime(request.getConsultationTime())
                .duration(request.getDuration())
                .platform(request.getPlatform())
                .meetingLink(request.getMeetingLink())
                .category(request.getCategory())
                .notes(request.getNotes())
                .status(request.getStatus() != null ? request.getStatus() : "Scheduled")
                .build();

        VideoConsultation saved = consultationRepository.save(consultation);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VideoConsultationResponse getConsultationById(Long id) {
        VideoConsultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video consultation not found with id " + id));
        return mapToResponse(consultation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoConsultationResponse> getConsultationsByDoctorId(Long doctorId) {
        return consultationRepository.findByDoctorIdOrderByConsultationDateDesc(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoConsultationResponse> getConsultationsByPatientEmail(String patientEmail) {
        return consultationRepository.findByPatientEmailIgnoreCase(patientEmail)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VideoConsultationResponse updateConsultation(Long id, VideoConsultationRequest request) {
        VideoConsultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video consultation not found with id " + id));

        consultation.setPatientName(request.getPatientName());
        consultation.setPatientEmail(request.getPatientEmail().toLowerCase());
        consultation.setConsultationDate(request.getConsultationDate());
        consultation.setConsultationTime(request.getConsultationTime());
        consultation.setDuration(request.getDuration());
        consultation.setPlatform(request.getPlatform());
        consultation.setMeetingLink(request.getMeetingLink());
        consultation.setCategory(request.getCategory());
        consultation.setNotes(request.getNotes());
        if (request.getStatus() != null) {
            consultation.setStatus(request.getStatus());
        }

        VideoConsultation updated = consultationRepository.save(consultation);
        return mapToResponse(updated);
    }

    @Override
    public VideoConsultationResponse updateMeetingLink(Long id, String newLink) {
        VideoConsultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Video consultation not found with id " + id));

        consultation.setMeetingLink(newLink);
        VideoConsultation updated = consultationRepository.save(consultation);
        return mapToResponse(updated);
    }

    @Override
    public String generateMeetingLink(String platform) {
        String randomCode = generateRandomCode();
        return switch (platform) {
            case "Google Meet" -> "https://meet.google.com/" + randomCode;
            case "Zoom" -> "https://zoom.us/j/" + generateRandomNumericCode();
            case "Microsoft Teams" -> "https://teams.microsoft.com/l/meetup-join/" + randomCode;
            case "SmartCare Video" -> "https://smartcare-video.healthcare/room/" + randomCode;
            default -> "https://meet.example.com/" + randomCode;
        };
    }

    @Override
    public void deleteConsultation(Long id) {
        if (!consultationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Video consultation not found with id " + id);
        }
        consultationRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoConsultationResponse> getScheduledConsultationsByDoctorId(Long doctorId) {
        return consultationRepository.findScheduledConsultationsByDoctorId(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoConsultationResponse> getConsultationsByDoctorIdAndDate(Long doctorId, LocalDate date) {
        return consultationRepository.findByDoctorIdAndConsultationDate(doctorId, date)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private VideoConsultationResponse mapToResponse(VideoConsultation consultation) {
        return VideoConsultationResponse.builder()
                .id(consultation.getId())
                .doctorId(consultation.getDoctor().getId())
                .doctorName(consultation.getDoctor().getFullName())
                .patientName(consultation.getPatientName())
                .patientEmail(consultation.getPatientEmail())
                .consultationDate(consultation.getConsultationDate())
                .consultationTime(consultation.getConsultationTime())
                .duration(consultation.getDuration())
                .platform(consultation.getPlatform())
                .meetingLink(consultation.getMeetingLink())
                .category(consultation.getCategory())
                .notes(consultation.getNotes())
                .status(consultation.getStatus())
                .createdAt(consultation.getCreatedAt())
                .updatedAt(consultation.getUpdatedAt())
                .build();
    }

    private String generateRandomCode() {
        return java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private String generateRandomNumericCode() {
        return String.valueOf((long) (Math.random() * 10000000000L));
    }
}
