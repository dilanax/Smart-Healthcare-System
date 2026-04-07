package com.example.demo.controller;

<<<<<<< HEAD
<<<<<<< HEAD
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.DoctorRequest;
import com.example.demo.dto.DoctorStatusUpdateRequest;
import com.example.demo.dto.DoctorSummaryResponse;
import com.example.demo.dto.DoctorVerificationRequest;
import com.example.demo.entity.Doctor;
import com.example.demo.service.DoctorService;
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
=======
=======
>>>>>>> parent of 8b6b691 (Merge branch 'dev' into feature_doctor)
import com.example.demo.model.Doctor;
import com.example.demo.repo.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
<<<<<<< HEAD
>>>>>>> parent of d8dadb9 (Reapply "Merge branch 'dev' into feature_doctor")
=======
>>>>>>> parent of 8b6b691 (Merge branch 'dev' into feature_doctor)

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ApiResponse<List<Doctor>> getAllDoctors() {
        return ApiResponse.success("Doctors loaded successfully.", doctorService.getAllDoctors());
    }

    @GetMapping("/summary")
    public ApiResponse<DoctorSummaryResponse> getSummary() {
        return ApiResponse.success("Doctor summary loaded successfully.", doctorService.getSummary());
    }

    @GetMapping("/{doctorId}")
    public ApiResponse<Doctor> getDoctor(@PathVariable Long doctorId) {
        return ApiResponse.success("Doctor loaded successfully.", doctorService.getDoctorById(doctorId));
    }

    @PostMapping
    public ApiResponse<Doctor> createDoctor(@Valid @RequestBody DoctorRequest request) {
        return ApiResponse.success("Doctor profile created successfully.", doctorService.createDoctor(request));
    }

    @PutMapping("/{doctorId}")
    public ApiResponse<Doctor> updateDoctor(@PathVariable Long doctorId, @Valid @RequestBody DoctorRequest request) {
        return ApiResponse.success("Doctor profile updated successfully.", doctorService.updateDoctor(doctorId, request));
    }

    @PatchMapping("/{doctorId}/status")
    public ApiResponse<Doctor> updateStatus(@PathVariable Long doctorId,
                                            @Valid @RequestBody DoctorStatusUpdateRequest request) {
        return ApiResponse.success("Doctor status updated successfully.", doctorService.updateStatus(doctorId, request));
    }

    @PatchMapping("/{doctorId}/verification")
    public ApiResponse<Doctor> updateVerification(@PathVariable Long doctorId,
                                                  @Valid @RequestBody DoctorVerificationRequest request) {
        return ApiResponse.success("Doctor verification updated successfully.", doctorService.updateVerification(doctorId, request));
    }

    @DeleteMapping("/{doctorId}")
    public ApiResponse<Void> deleteDoctor(@PathVariable Long doctorId) {
        doctorService.deleteDoctor(doctorId);
        return ApiResponse.success("Doctor profile removed successfully.", null);
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> parent of 8b6b691 (Merge branch 'dev' into feature_doctor)
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;

    /**
     * Get all doctors
     */
    @GetMapping
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        List<Doctor> doctors = doctorRepository.findAll();
        return ResponseEntity.ok(doctors);
    }

    /**
     * Get doctor by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable int id) {
        return doctorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Create a new doctor
     */
    @PostMapping
    public ResponseEntity<Doctor> createDoctor(@RequestBody Doctor doctor) {
        Doctor savedDoctor = doctorRepository.save(doctor);
        return ResponseEntity.ok(savedDoctor);
    }

    /**
     * Update doctor
     */
    @PutMapping("/{id}")
    public ResponseEntity<Doctor> updateDoctor(@PathVariable int id, @RequestBody Doctor doctorDetails) {
        return doctorRepository.findById(id)
                .map(doctor -> {
                    doctor.setFirstName(doctorDetails.getFirstName());
                    doctor.setLastName(doctorDetails.getLastName());
                    doctor.setSpecialty(doctorDetails.getSpecialty());
                    doctor.setRating(doctorDetails.getRating());
                    doctor.setExperienceYears(doctorDetails.getExperienceYears());
                    doctor.setPatientCount(doctorDetails.getPatientCount());
                    return ResponseEntity.ok(doctorRepository.save(doctor));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Delete doctor
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable int id) {
        doctorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
<<<<<<< HEAD
>>>>>>> parent of d8dadb9 (Reapply "Merge branch 'dev' into feature_doctor")
=======
>>>>>>> parent of 8b6b691 (Merge branch 'dev' into feature_doctor)
    }
}
