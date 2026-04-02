package com.example.demo.repository;

import com.example.demo.entity.Doctor;
import com.example.demo.entity.DoctorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByLicenseNumberIgnoreCase(String licenseNumber);

    long countByVerifiedTrue();

    long countByStatus(DoctorStatus status);
}
