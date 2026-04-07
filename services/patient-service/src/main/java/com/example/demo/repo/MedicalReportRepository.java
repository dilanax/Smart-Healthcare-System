package com.example.demo.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.model.MedicalReport;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    
    // This lets us fetch all reports belonging to one specific patient
    List<MedicalReport> findByPatientId(Long patientId);
}