package com.example.demo.service;

import com.example.demo.dto.PatientDetailDto;

public interface PatientDetailService {
    PatientDetailDto getPatientDetailByEmail(String email);
    PatientDetailDto createPatientDetail(PatientDetailDto detailDto);
    PatientDetailDto updatePatientDetail(String email, PatientDetailDto detailDto);
    void deletePatientDetail(String email);
}
