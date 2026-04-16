package com.smarthealthcare.aisymptom.model;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class SymptomRequest {
    @NotEmpty
    private List<String> symptoms;

    public List<String> getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(List<String> symptoms) {
        this.symptoms = symptoms;
    }
}
