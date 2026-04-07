package com.example.demo.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.model.Patient;
import com.example.demo.repo.PatientRepository;

@Service
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    public PatientServiceImpl(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public Patient createOrUpdateProfile(Patient patient) {
        Optional<Patient> existingPatient = patientRepository.findByUserId(patient.getUserId());
        if (existingPatient.isPresent()) {
            Patient existing = existingPatient.get();
            existing.setFirstName(patient.getFirstName());
            existing.setLastName(patient.getLastName());
            existing.setContactNumber(patient.getContactNumber());
            existing.setAddress(patient.getAddress());
            existing.setBloodGroup(patient.getBloodGroup());
            existing.setAllergies(patient.getAllergies());
            return patientRepository.save(existing);
        } else {
            return patientRepository.save(patient);
        }
    }

    @Override
    public Patient getProfileByUserId(Long userId) {
        return patientRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Patient profile not found for user ID: " + userId));
    }
}