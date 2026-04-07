package com.example.demo.dto;

import lombok.Data;

@Data
public class PatientDetailDto {
    private Long id;
    private String email;
    private String dateOfBirth;
    private String gender;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String country;
    private String emergencyContactName;
    private String emergencyContactRelationship;
    private String emergencyContactPhone;
    private String bloodType;
    private Double height;
    private Double weight;
    private String allergies;
    private String chronicDiseases;
    private String previousSurgeries;
    private String currentMedications;
}
