package com.example.demo.service;

import com.example.demo.dto.PatientDetailDto;
import com.example.demo.model.PatientDetail;
import com.example.demo.repo.PatientDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PatientDetailServiceImpl implements PatientDetailService {

    private final PatientDetailRepository patientDetailRepository;

    @Override
    public PatientDetailDto getPatientDetailByEmail(String email) {
        Optional<PatientDetail> detail = patientDetailRepository.findByEmail(email);
        if (detail.isEmpty()) {
            return null;
        }
        return convertToDto(detail.get());
    }

    @Override
    public PatientDetailDto createPatientDetail(PatientDetailDto detailDto) {
        Optional<PatientDetail> existing = patientDetailRepository.findByEmail(detailDto.getEmail());
        if (existing.isPresent()) {
            return updatePatientDetail(detailDto.getEmail(), detailDto);
        }

        PatientDetail detail = PatientDetail.builder()
                .email(detailDto.getEmail())
                .dateOfBirth(detailDto.getDateOfBirth())
                .gender(detailDto.getGender())
                .address(detailDto.getAddress())
                .city(detailDto.getCity())
                .state(detailDto.getState())
                .zipCode(detailDto.getZipCode())
                .country(detailDto.getCountry())
                .emergencyContactName(detailDto.getEmergencyContactName())
                .emergencyContactRelationship(detailDto.getEmergencyContactRelationship())
                .emergencyContactPhone(detailDto.getEmergencyContactPhone())
                .bloodType(detailDto.getBloodType())
                .height(detailDto.getHeight())
                .weight(detailDto.getWeight())
                .allergies(detailDto.getAllergies())
                .chronicDiseases(detailDto.getChronicDiseases())
                .previousSurgeries(detailDto.getPreviousSurgeries())
                .currentMedications(detailDto.getCurrentMedications())
                .build();

        PatientDetail saved = patientDetailRepository.save(detail);
        return convertToDto(saved);
    }

    @Override
    public PatientDetailDto updatePatientDetail(String email, PatientDetailDto detailDto) {
        Optional<PatientDetail> existing = patientDetailRepository.findByEmail(email);
        if (existing.isEmpty()) {
            return createPatientDetail(detailDto);
        }

        PatientDetail detail = existing.get();

        if (detailDto.getDateOfBirth() != null && !detailDto.getDateOfBirth().isBlank()) {
            detail.setDateOfBirth(detailDto.getDateOfBirth());
        }
        if (detailDto.getGender() != null && !detailDto.getGender().isBlank()) {
            detail.setGender(detailDto.getGender());
        }
        if (detailDto.getAddress() != null && !detailDto.getAddress().isBlank()) {
            detail.setAddress(detailDto.getAddress());
        }
        if (detailDto.getCity() != null && !detailDto.getCity().isBlank()) {
            detail.setCity(detailDto.getCity());
        }
        if (detailDto.getState() != null && !detailDto.getState().isBlank()) {
            detail.setState(detailDto.getState());
        }
        if (detailDto.getZipCode() != null && !detailDto.getZipCode().isBlank()) {
            detail.setZipCode(detailDto.getZipCode());
        }
        if (detailDto.getCountry() != null && !detailDto.getCountry().isBlank()) {
            detail.setCountry(detailDto.getCountry());
        }
        if (detailDto.getEmergencyContactName() != null && !detailDto.getEmergencyContactName().isBlank()) {
            detail.setEmergencyContactName(detailDto.getEmergencyContactName());
        }
        if (detailDto.getEmergencyContactRelationship() != null && !detailDto.getEmergencyContactRelationship().isBlank()) {
            detail.setEmergencyContactRelationship(detailDto.getEmergencyContactRelationship());
        }
        if (detailDto.getEmergencyContactPhone() != null && !detailDto.getEmergencyContactPhone().isBlank()) {
            detail.setEmergencyContactPhone(detailDto.getEmergencyContactPhone());
        }
        if (detailDto.getBloodType() != null && !detailDto.getBloodType().isBlank()) {
            detail.setBloodType(detailDto.getBloodType());
        }
        if (detailDto.getHeight() != null && detailDto.getHeight() > 0) {
            detail.setHeight(detailDto.getHeight());
        }
        if (detailDto.getWeight() != null && detailDto.getWeight() > 0) {
            detail.setWeight(detailDto.getWeight());
        }
        if (detailDto.getAllergies() != null && !detailDto.getAllergies().isBlank()) {
            detail.setAllergies(detailDto.getAllergies());
        }
        if (detailDto.getChronicDiseases() != null && !detailDto.getChronicDiseases().isBlank()) {
            detail.setChronicDiseases(detailDto.getChronicDiseases());
        }
        if (detailDto.getPreviousSurgeries() != null && !detailDto.getPreviousSurgeries().isBlank()) {
            detail.setPreviousSurgeries(detailDto.getPreviousSurgeries());
        }
        if (detailDto.getCurrentMedications() != null && !detailDto.getCurrentMedications().isBlank()) {
            detail.setCurrentMedications(detailDto.getCurrentMedications());
        }

        PatientDetail saved = patientDetailRepository.save(detail);
        return convertToDto(saved);
    }

    @Override
    public void deletePatientDetail(String email) {
        Optional<PatientDetail> detail = patientDetailRepository.findByEmail(email);
        if (detail.isPresent()) {
            patientDetailRepository.delete(detail.get());
        }
    }

    private PatientDetailDto convertToDto(PatientDetail detail) {
        PatientDetailDto dto = new PatientDetailDto();
        dto.setId(detail.getId());
        dto.setEmail(detail.getEmail());
        dto.setDateOfBirth(detail.getDateOfBirth());
        dto.setGender(detail.getGender());
        dto.setAddress(detail.getAddress());
        dto.setCity(detail.getCity());
        dto.setState(detail.getState());
        dto.setZipCode(detail.getZipCode());
        dto.setCountry(detail.getCountry());
        dto.setEmergencyContactName(detail.getEmergencyContactName());
        dto.setEmergencyContactRelationship(detail.getEmergencyContactRelationship());
        dto.setEmergencyContactPhone(detail.getEmergencyContactPhone());
        dto.setBloodType(detail.getBloodType());
        dto.setHeight(detail.getHeight());
        dto.setWeight(detail.getWeight());
        dto.setAllergies(detail.getAllergies());
        dto.setChronicDiseases(detail.getChronicDiseases());
        dto.setPreviousSurgeries(detail.getPreviousSurgeries());
        dto.setCurrentMedications(detail.getCurrentMedications());
        return dto;
    }
}
