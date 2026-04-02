package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.PatientRequest;
import com.example.demo.dto.PatientStatusUpdateRequest;
import com.example.demo.dto.PatientSummaryResponse;
import com.example.demo.entity.Patient;
import com.example.demo.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @GetMapping
    public ApiResponse<List<Patient>> getAllPatients() {
        return ApiResponse.success("Patients loaded successfully.", patientService.getAllPatients());
    }

    @GetMapping("/summary")
    public ApiResponse<PatientSummaryResponse> getSummary() {
        return ApiResponse.success("Patient summary loaded successfully.", patientService.getSummary());
    }

    @GetMapping("/{patientId}")
    public ApiResponse<Patient> getPatient(@PathVariable Long patientId) {
        return ApiResponse.success("Patient loaded successfully.", patientService.getPatientById(patientId));
    }

    @PostMapping
    public ApiResponse<Patient> createPatient(@Valid @RequestBody PatientRequest request) {
        return ApiResponse.success("Patient profile created successfully.", patientService.createPatient(request));
    }

    @PutMapping("/{patientId}")
    public ApiResponse<Patient> updatePatient(@PathVariable Long patientId, @Valid @RequestBody PatientRequest request) {
        return ApiResponse.success("Patient profile updated successfully.", patientService.updatePatient(patientId, request));
    }

    @PatchMapping("/{patientId}/status")
    public ApiResponse<Patient> updateStatus(@PathVariable Long patientId,
                                             @Valid @RequestBody PatientStatusUpdateRequest request) {
        return ApiResponse.success("Patient status updated successfully.", patientService.updateStatus(patientId, request));
    }

    @DeleteMapping("/{patientId}")
    public ApiResponse<Void> deletePatient(@PathVariable Long patientId) {
        patientService.deletePatient(patientId);
        return ApiResponse.success("Patient profile removed successfully.", null);
    }
}
