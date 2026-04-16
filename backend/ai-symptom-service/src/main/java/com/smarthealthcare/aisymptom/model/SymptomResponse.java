package com.smarthealthcare.aisymptom.model;

import java.util.List;

public class SymptomResponse {
    private String suggestion;
    private List<String> recommendedSpecialties;

    public SymptomResponse(String suggestion, List<String> recommendedSpecialties) {
        this.suggestion = suggestion;
        this.recommendedSpecialties = recommendedSpecialties;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }

    public List<String> getRecommendedSpecialties() {
        return recommendedSpecialties;
    }

    public void setRecommendedSpecialties(List<String> recommendedSpecialties) {
        this.recommendedSpecialties = recommendedSpecialties;
    }
}
