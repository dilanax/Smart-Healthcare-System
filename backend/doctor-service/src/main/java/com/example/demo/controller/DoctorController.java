package com.example.demo.controller;

import com.example.demo.model.Doctor;
import com.example.demo.repo.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
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
        if (doctor.getUserId() == null) {
            return ResponseEntity.badRequest().build();
        }

        if (doctorRepository.existsById(doctor.getUserId())) {
            return ResponseEntity.status(409).build();
        }

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
                    doctor.setSpecialization(doctorDetails.getSpecialization());
                    doctor.setHospital(doctorDetails.getHospital());
                    doctor.setEmail(doctorDetails.getEmail());
                    doctor.setPhoneNumber(doctorDetails.getPhoneNumber());
                    doctor.setImageUrl(doctorDetails.getImageUrl());
                    doctor.setAvailability(doctorDetails.getAvailability());
                    doctor.setConsultationFee(doctorDetails.getConsultationFee());
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
    }
}
