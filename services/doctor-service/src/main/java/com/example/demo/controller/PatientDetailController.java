package com.example.demo.controller;

import com.example.demo.dto.PatientDetailDto;
import com.example.demo.service.PatientDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patient-details")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PatientDetailController {

    private final PatientDetailService patientDetailService;

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getPatientDetailByEmail(@PathVariable String email) {
        try {
            PatientDetailDto detail = patientDetailService.getPatientDetailByEmail(email);
            if (detail == null) {
                return ResponseEntity.ok(new ApiResponse("No details found", null));
            }
            return ResponseEntity.ok(new ApiResponse("Patient details retrieved successfully", detail));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse("Error retrieving patient details: " + e.getMessage(), null));
        }
    }

    @PostMapping
    public ResponseEntity<?> createPatientDetail(@RequestBody PatientDetailDto detailDto) {
        try {
            PatientDetailDto created = patientDetailService.createPatientDetail(detailDto);
            return ResponseEntity.ok(new ApiResponse("Patient details created successfully", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse("Error creating patient details: " + e.getMessage(), null));
        }
    }

    @PutMapping("/email/{email}")
    public ResponseEntity<?> updatePatientDetail(@PathVariable String email, @RequestBody PatientDetailDto detailDto) {
        try {
            detailDto.setEmail(email);
            PatientDetailDto updated = patientDetailService.updatePatientDetail(email, detailDto);
            return ResponseEntity.ok(new ApiResponse("Patient details updated successfully", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse("Error updating patient details: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/email/{email}")
    public ResponseEntity<?> deletePatientDetail(@PathVariable String email) {
        try {
            patientDetailService.deletePatientDetail(email);
            return ResponseEntity.ok(new ApiResponse("Patient details deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse("Error deleting patient details: " + e.getMessage(), null));
        }
    }

    public static class ApiResponse {
        public String message;
        public Object data;

        public ApiResponse(String message, Object data) {
            this.message = message;
            this.data = data;
        }
    }
}
