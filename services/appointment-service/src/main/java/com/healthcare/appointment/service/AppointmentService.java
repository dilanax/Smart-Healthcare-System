package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.AppointmentRequestDto;
import com.healthcare.appointment.dto.AppointmentResponseDto;
import com.healthcare.appointment.dto.AppointmentStatusUpdateDto;
import com.healthcare.appointment.model.Appointment;
import com.healthcare.appointment.model.AppointmentStatus;
import com.healthcare.appointment.repo.AppointmentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public AppointmentResponseDto createAppointment(AppointmentRequestDto requestDto) {
        Appointment appointment = new Appointment();
        appointment.setPatientId(requestDto.getPatientId());
        appointment.setDoctorId(requestDto.getDoctorId());
        appointment.setDoctorFirstName(requestDto.getDoctorFirstName());
        appointment.setDoctorLastName(requestDto.getDoctorLastName());
        appointment.setAppointmentDate(requestDto.getAppointmentDate());
        appointment.setAppointmentTime(requestDto.getAppointmentTime());
        appointment.setReason(requestDto.getReason());
        appointment.setToken(requestDto.getToken());
        appointment.setStatus(AppointmentStatus.PENDING);

        Appointment savedAppointment = appointmentRepository.save(appointment);
        return mapToResponse(savedAppointment);
    }

    public List<AppointmentResponseDto> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDto> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDto> getAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDto> getAppointmentsByDoctorIdAndDate(Long doctorId, LocalDate appointmentDate) {
        return appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, appointmentDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AppointmentResponseDto getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        return mapToResponse(appointment);
    }

    public AppointmentResponseDto updateAppointment(Long id, AppointmentRequestDto requestDto) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setPatientId(requestDto.getPatientId());
        appointment.setDoctorId(requestDto.getDoctorId());
        appointment.setAppointmentDate(requestDto.getAppointmentDate());
        appointment.setAppointmentTime(requestDto.getAppointmentTime());
        appointment.setReason(requestDto.getReason());
        
        // If status is provided in the request, use it; otherwise keep existing status
        if (requestDto.getStatus() != null) {
            appointment.setStatus(requestDto.getStatus());
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return mapToResponse(updatedAppointment);
    }

    public String deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointmentRepository.delete(appointment);
        return "Appointment deleted successfully";
    }

    public AppointmentResponseDto updateAppointmentStatus(Long id, AppointmentStatusUpdateDto dto) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(dto.getStatus());
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return mapToResponse(updatedAppointment);
    }

    private AppointmentResponseDto mapToResponse(Appointment appointment) {
        return new AppointmentResponseDto(
                appointment.getId(),
                appointment.getPatientId(),
                appointment.getDoctorId(),
                appointment.getDoctorFirstName(),
                appointment.getDoctorLastName(),
                appointment.getAppointmentDate(),
                appointment.getAppointmentTime(),
                appointment.getReason(),
                appointment.getToken(),
                appointment.getStatus(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }
}
