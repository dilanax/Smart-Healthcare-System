package com.example.demo.service;

import com.example.demo.dto.DoctorRequest;
import com.example.demo.dto.DoctorStatusUpdateRequest;
import com.example.demo.dto.DoctorSummaryResponse;
import com.example.demo.dto.DoctorVerificationRequest;
import com.example.demo.entity.Doctor;

import java.util.List;

public interface DoctorService {

    List<Doctor> getAllDoctors();

    Doctor getDoctorById(Long doctorId);

    Doctor createDoctor(DoctorRequest request);

    Doctor updateDoctor(Long doctorId, DoctorRequest request);

    Doctor updateStatus(Long doctorId, DoctorStatusUpdateRequest request);

    Doctor updateVerification(Long doctorId, DoctorVerificationRequest request);

    void deleteDoctor(Long doctorId);

    DoctorSummaryResponse getSummary();
}
