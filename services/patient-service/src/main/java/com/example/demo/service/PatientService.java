package com.example.demo.service;

import com.example.demo.model.Patient;

public interface PatientService {
    Patient createOrUpdateProfile(Patient patient);
    Patient getProfileByUserId(Long userId);
}