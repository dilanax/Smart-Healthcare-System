package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.AppointmentRequestDto;
import com.healthcare.appointment.dto.AppointmentResponseDto;
import com.healthcare.appointment.dto.AppointmentStatusUpdateDto;
import com.healthcare.appointment.service.AppointmentService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping(consumes = "application/json")
    public AppointmentResponseDto createAppointment(@RequestBody AppointmentRequestDto requestDto) {
        return appointmentService.createAppointment(requestDto);
    }

    @GetMapping
    public List<AppointmentResponseDto> getAllAppointments(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate appointmentDate) {
        if (patientId != null) {
            return appointmentService.getAppointmentsByPatientId(patientId);
        }
        if (doctorId != null) {
            if (appointmentDate != null) {
                return appointmentService.getAppointmentsByDoctorIdAndDate(doctorId, appointmentDate);
            }
            return appointmentService.getAppointmentsByDoctorId(doctorId);
        }
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    public AppointmentResponseDto getAppointmentById(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id);
    }

    @PutMapping("/{id}")
    public AppointmentResponseDto updateAppointment(@PathVariable Long id,
                                                    @RequestBody AppointmentRequestDto requestDto) {
        return appointmentService.updateAppointment(id, requestDto);
    }

    @DeleteMapping("/{id}")
    public String deleteAppointment(@PathVariable Long id) {
        return appointmentService.deleteAppointment(id);
    }

    @PutMapping("/{id}/status")
    public AppointmentResponseDto updateAppointmentStatus(@PathVariable Long id,
                                                          @RequestBody AppointmentStatusUpdateDto dto) {
        return appointmentService.updateAppointmentStatus(id, dto);
    }

    @PatchMapping("/{id}")
    public AppointmentResponseDto patchAppointment(@PathVariable Long id,
                                                    @RequestBody AppointmentStatusUpdateDto dto) {
        return appointmentService.updateAppointmentStatus(id, dto);
    }
}
