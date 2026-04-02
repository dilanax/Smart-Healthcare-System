package com.example.demo.service;

import com.example.demo.dto.PatientRequest;
import com.example.demo.dto.PatientStatusUpdateRequest;
import com.example.demo.dto.PatientSummaryResponse;
import com.example.demo.entity.Patient;

import java.util.List;

public interface PatientService {

    List<Patient> getAllPatients();

    Patient getPatientById(Long patientId);

    Patient createPatient(PatientRequest request);

    Patient updatePatient(Long patientId, PatientRequest request);

    Patient updateStatus(Long patientId, PatientStatusUpdateRequest request);

    void deletePatient(Long patientId);

    PatientSummaryResponse getSummary();
}
