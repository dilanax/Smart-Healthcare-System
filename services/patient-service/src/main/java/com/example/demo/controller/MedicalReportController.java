package com.example.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.dto.ApiResponseDto;
import com.example.demo.model.MedicalReport;
import com.example.demo.service.MedicalReportService;

@RestController
@RequestMapping("/api/reports") 
// 🚨 @CrossOrigin REMOVED intentionally to prevent double-header conflicts! 🚨
public class MedicalReportController {

    @Autowired
    private MedicalReportService reportService;

    // 1. Upload a new medical report
    @PostMapping("/upload/{patientId}")
    public ApiResponseDto uploadReport(
            @PathVariable Long patientId, 
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {
        try {
            MedicalReport savedReport = reportService.storeFile(patientId, file, description);
            // Must nullify the byte array before sending JSON back, or the browser will crash
            savedReport.setData(null); 
            return new ApiResponseDto("File uploaded successfully", savedReport);
        } catch (IOException e) {
            return new ApiResponseDto("Could not upload the file: " + e.getMessage(), null);
        }
    }

    // 2. Get a list of all reports for a specific patient
    @GetMapping("/patient/{patientId}")
    public ApiResponseDto getAllPatientReports(@PathVariable Long patientId) {
        List<MedicalReport> reports = reportService.getAllReportsForPatient(patientId);
        // Hide the heavy byte array from the list view to make it load instantly
        reports.forEach(report -> report.setData(null)); 
        return new ApiResponseDto("Reports fetched", reports);
    }

    // 3. Download or view a specific report
    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long fileId) {
        try {
            MedicalReport report = reportService.getFile(fileId);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + report.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(report.getFileType()))
                    .body(report.getData());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}