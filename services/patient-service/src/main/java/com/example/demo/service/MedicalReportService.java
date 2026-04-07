package com.example.demo.service;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.MedicalReport;
import com.example.demo.repo.MedicalReportRepository;

@Service
public class MedicalReportService {

    @Autowired
    private MedicalReportRepository reportRepository;

    // Logic to save a file
    public MedicalReport storeFile(Long patientId, MultipartFile file) throws IOException {
        // Clean the file name to prevent security issues
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        if (fileName.contains("..")) {
            throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
        }

        // Create the report object and extract the bytes
        MedicalReport report = new MedicalReport(patientId, fileName, file.getContentType(), file.getBytes());

        return reportRepository.save(report);
    }

    // Logic to retrieve a specific file for download
    public MedicalReport getFile(Long fileId) {
        return reportRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));
    }

    // Logic to get a list of all files for a patient
    public List<MedicalReport> getAllReportsForPatient(Long patientId) {
        return reportRepository.findByPatientId(patientId);
    }
}