package com.smarthealthcare.aisymptom.controller;

import com.smarthealthcare.aisymptom.model.SymptomRequest;
import com.smarthealthcare.aisymptom.model.SymptomResponse;
import com.smarthealthcare.aisymptom.service.SymptomCheckerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/symptom-checker")
public class SymptomCheckerController {
    @Autowired
    private SymptomCheckerService symptomCheckerService;

    @PostMapping
    public ResponseEntity<SymptomResponse> checkSymptoms(@Valid @RequestBody SymptomRequest request) {
        SymptomResponse response = symptomCheckerService.analyzeSymptoms(request);
        return ResponseEntity.ok(response);
    }
}
