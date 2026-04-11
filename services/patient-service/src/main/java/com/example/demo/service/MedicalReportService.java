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

    public MedicalReport storeFile(Long patientId, MultipartFile file, String description) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        if (fileName.contains("..")) {
            throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
        }

        MedicalReport report = new MedicalReport(patientId, fileName, file.getContentType(), description, file.getBytes());
        return reportRepository.save(report);
    }

    public MedicalReport getFile(Long fileId) {
        return reportRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));
    }

    public List<MedicalReport> getAllReportsForPatient(Long patientId) {
        return reportRepository.findByPatientId(patientId);
    }
}