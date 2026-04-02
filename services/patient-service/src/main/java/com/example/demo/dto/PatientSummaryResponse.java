package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PatientSummaryResponse {

    private long totalPatients;
    private long activePatients;
    private long dischargedPatients;
    private long criticalPatients;
}
