package com.example.demo.dto;

import com.example.demo.entity.PatientStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatientStatusUpdateRequest {

    @NotNull
    private PatientStatus status;
}
