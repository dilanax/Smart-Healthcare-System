package com.example.demo.repository;

import com.example.demo.entity.Patient;
import com.example.demo.entity.PatientStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    long countByStatus(PatientStatus status);
}
