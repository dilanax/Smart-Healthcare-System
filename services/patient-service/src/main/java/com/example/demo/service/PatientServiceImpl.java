package com.example.demo.service;

import com.example.demo.dto.PatientRequest;
import com.example.demo.dto.PatientStatusUpdateRequest;
import com.example.demo.dto.PatientSummaryResponse;
import com.example.demo.entity.Patient;
import com.example.demo.entity.PatientStatus;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    @Override
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @Override
    public Patient getPatientById(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id " + patientId));
    }

    @Override
    public Patient createPatient(PatientRequest request) {
        validateEmail(request.getEmail(), null);
        Patient patient = Patient.builder().build();
        mapRequest(patient, request);
        return patientRepository.save(patient);
    }

    @Override
    public Patient updatePatient(Long patientId, PatientRequest request) {
        Patient patient = getPatientById(patientId);
        validateEmail(request.getEmail(), patientId);
        mapRequest(patient, request);
        return patientRepository.save(patient);
    }

    @Override
    public Patient updateStatus(Long patientId, PatientStatusUpdateRequest request) {
        Patient patient = getPatientById(patientId);
        patient.setStatus(request.getStatus());
        return patientRepository.save(patient);
    }

    @Override
    public void deletePatient(Long patientId) {
        patientRepository.delete(getPatientById(patientId));
    }

    @Override
    public PatientSummaryResponse getSummary() {
        return PatientSummaryResponse.builder()
                .totalPatients(patientRepository.count())
                .activePatients(patientRepository.countByStatus(PatientStatus.ACTIVE))
                .dischargedPatients(patientRepository.countByStatus(PatientStatus.DISCHARGED))
                .criticalPatients(patientRepository.countByStatus(PatientStatus.CRITICAL))
                .build();
    }

    private void mapRequest(Patient patient, PatientRequest request) {
        patient.setFullName(request.getFullName().trim());
        patient.setEmail(request.getEmail().trim().toLowerCase());
        patient.setPhoneNumber(request.getPhoneNumber().trim());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender().trim());
        patient.setBloodGroup(request.getBloodGroup().trim().toUpperCase());
        patient.setMedicalConditions(request.getMedicalConditions() == null
                ? List.of()
                : request.getMedicalConditions().stream().map(String::trim).toList());
        patient.setEmergencyContactName(request.getEmergencyContactName().trim());
        patient.setEmergencyContactPhone(request.getEmergencyContactPhone().trim());
        patient.setAssignedDoctor(request.getAssignedDoctor().trim());
        patient.setAddress(request.getAddress().trim());
        patient.setStatus(request.getStatus());
    }

    private void validateEmail(String email, Long existingId) {
        String normalizedEmail = email.trim().toLowerCase();
        boolean conflict = patientRepository.findAll().stream()
                .anyMatch(patient -> patient.getEmail().equalsIgnoreCase(normalizedEmail)
                        && (existingId == null || !patient.getId().equals(existingId)));
        if (conflict) {
            throw new IllegalArgumentException("A patient profile already exists for email " + normalizedEmail);
        }
    }
}
