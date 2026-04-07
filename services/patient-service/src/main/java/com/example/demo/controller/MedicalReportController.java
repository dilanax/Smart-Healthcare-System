package com.example.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.model.MedicalReport;
import com.example.demo.service.MedicalReportService;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class MedicalReportController {

    @Autowired
    private MedicalReportService reportService;

    // 1. Upload a new medical report
    @PostMapping("/{patientId}/reports")
    public ResponseEntity<?> uploadReport(
            @PathVariable Long patientId, 
            @RequestParam("file") MultipartFile file) {
        try {
            MedicalReport savedReport = reportService.storeFile(patientId, file);
            return ResponseEntity.ok("File uploaded successfully! ID: " + savedReport.getId() + ", Name: " + savedReport.getFileName());
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Could not upload the file: " + e.getMessage());
        }
    }

    // 2. Get a list of all reports for a specific patient
    @GetMapping("/{patientId}/reports")
    public ResponseEntity<List<MedicalReport>> getAllPatientReports(@PathVariable Long patientId) {
        List<MedicalReport> reports = reportService.getAllReportsForPatient(patientId);
        return ResponseEntity.ok(reports);
    }

    // 3. Download or view a specific report
    @GetMapping("/reports/download/{fileId}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long fileId) {
        try {
            MedicalReport report = reportService.getFile(fileId);

            // This tells the browser to download the file with its original name and type
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(report.getFileType()))
                    .body(report.getData());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}