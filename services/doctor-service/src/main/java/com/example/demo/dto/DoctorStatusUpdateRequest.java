package com.example.demo.dto;

import com.example.demo.entity.DoctorStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorStatusUpdateRequest {

    @NotNull
    private DoctorStatus status;
}
