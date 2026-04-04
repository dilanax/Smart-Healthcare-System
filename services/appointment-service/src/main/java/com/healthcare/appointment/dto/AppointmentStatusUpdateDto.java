package com.healthcare.appointment.dto;

import com.healthcare.appointment.model.AppointmentStatus;

public class AppointmentStatusUpdateDto {
    private AppointmentStatus status;

    public AppointmentStatusUpdateDto() {
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }
}