package com.example.demo.service;

import com.example.demo.dto.DoctorRequest;
import com.example.demo.dto.DoctorStatusUpdateRequest;
import com.example.demo.dto.DoctorSummaryResponse;
import com.example.demo.dto.DoctorVerificationRequest;
import com.example.demo.entity.Doctor;
import com.example.demo.entity.DoctorStatus;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;

    @Override
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @Override
    public Doctor getDoctorById(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id " + doctorId));
    }

    @Override
    public Doctor createDoctor(DoctorRequest request) {
        validateDoctorUniqueness(request, null);
        Doctor doctor = Doctor.builder().build();
        mapRequest(doctor, request);
        return doctorRepository.save(doctor);
    }

    @Override
    public Doctor updateDoctor(Long doctorId, DoctorRequest request) {
        Doctor doctor = getDoctorById(doctorId);
        validateDoctorUniqueness(request, doctorId);
        mapRequest(doctor, request);
        return doctorRepository.save(doctor);
    }

    @Override
    public Doctor updateStatus(Long doctorId, DoctorStatusUpdateRequest request) {
        Doctor doctor = getDoctorById(doctorId);
        doctor.setStatus(request.getStatus());
        return doctorRepository.save(doctor);
    }

    @Override
    public Doctor updateVerification(Long doctorId, DoctorVerificationRequest request) {
        Doctor doctor = getDoctorById(doctorId);
        doctor.setVerified(request.getVerified());
        return doctorRepository.save(doctor);
    }

    @Override
    public void deleteDoctor(Long doctorId) {
        doctorRepository.delete(getDoctorById(doctorId));
    }

    @Override
    public DoctorSummaryResponse getSummary() {
        return DoctorSummaryResponse.builder()
                .totalDoctors(doctorRepository.count())
                .verifiedDoctors(doctorRepository.countByVerifiedTrue())
                .activeDoctors(doctorRepository.countByStatus(DoctorStatus.ACTIVE))
                .onLeaveDoctors(doctorRepository.countByStatus(DoctorStatus.ON_LEAVE))
                .inactiveDoctors(doctorRepository.countByStatus(DoctorStatus.INACTIVE))
                .build();
    }

    private void mapRequest(Doctor doctor, DoctorRequest request) {
        doctor.setFullName(request.getFullName().trim());
        doctor.setEmail(request.getEmail().trim().toLowerCase());
        doctor.setPhoneNumber(request.getPhoneNumber().trim());
        doctor.setSpecialization(request.getSpecialization().trim());
        doctor.setLicenseNumber(request.getLicenseNumber().trim().toUpperCase());
        doctor.setDepartment(request.getDepartment().trim());
        doctor.setRoomNumber(request.getRoomNumber().trim());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setStatus(request.getStatus());
        doctor.setVerified(Boolean.TRUE.equals(request.getVerified()));
        doctor.setAvailableDays(request.getAvailableDays().stream().map(String::trim).toList());
        doctor.setBiography(request.getBiography() == null ? null : request.getBiography().trim());
    }

    private void validateDoctorUniqueness(DoctorRequest request, Long existingId) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        boolean emailConflict = doctorRepository.findAll().stream()
                .anyMatch(doctor -> doctor.getEmail().equalsIgnoreCase(normalizedEmail)
                        && (existingId == null || !doctor.getId().equals(existingId)));
        if (emailConflict) {
            throw new IllegalArgumentException("A doctor profile already exists for email " + normalizedEmail);
        }

        String normalizedLicense = request.getLicenseNumber().trim().toUpperCase();
        boolean licenseConflict = doctorRepository.findAll().stream()
                .anyMatch(doctor -> doctor.getLicenseNumber().equalsIgnoreCase(normalizedLicense)
                        && (existingId == null || !doctor.getId().equals(existingId)));
        if (licenseConflict) {
            throw new IllegalArgumentException("License number " + normalizedLicense + " is already in use");
        }
    }
}
