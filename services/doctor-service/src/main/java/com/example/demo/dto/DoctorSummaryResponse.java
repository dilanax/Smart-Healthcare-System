package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DoctorSummaryResponse {

    private long totalDoctors;
    private long verifiedDoctors;
    private long activeDoctors;
    private long onLeaveDoctors;
    private long inactiveDoctors;
}
