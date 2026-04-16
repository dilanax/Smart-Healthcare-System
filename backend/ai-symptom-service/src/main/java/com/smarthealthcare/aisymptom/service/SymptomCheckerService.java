package com.smarthealthcare.aisymptom.service;

import com.smarthealthcare.aisymptom.model.SymptomRequest;
import com.smarthealthcare.aisymptom.model.SymptomResponse;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class SymptomCheckerService {
    // This is a placeholder for AI/ML integration. Replace with real API/model call.
    public SymptomResponse analyzeSymptoms(SymptomRequest request) {
        List<String> symptoms = request.getSymptoms();
        // Example logic: If "fever" and "cough" are present, suggest "Flu" and "General Physician"
        if (symptoms.contains("fever") && symptoms.contains("cough")) {
            return new SymptomResponse(
                "You may have symptoms of flu. Please consult a General Physician.",
                Collections.singletonList("General Physician")
            );
        }
        // Example: If "chest pain" is present, suggest "Cardiologist"
        if (symptoms.contains("chest pain")) {
            return new SymptomResponse(
                "Chest pain can be serious. Please consult a Cardiologist immediately.",
                Collections.singletonList("Cardiologist")
            );
        }
        // Default suggestion
        return new SymptomResponse(
            "Unable to determine. Please consult a doctor for further evaluation.",
            Arrays.asList("General Physician")
        );
    }
}
