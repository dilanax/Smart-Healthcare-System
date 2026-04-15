package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity(name = "doctors")
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int userId;
    private String firstName;
    private String lastName;
    private String specialty;
    private double rating;
    private int experienceYears;
    private int patientCount;

    public Doctor() {}

    public Doctor(int userId, String firstName, String lastName, String specialty, double rating, int experienceYears, int patientCount) {
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.specialty = specialty;
        this.rating = rating;
        this.experienceYears = experienceYears;
        this.patientCount = patientCount;
    }

    // Getters and Setters
    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(int experienceYears) {
        this.experienceYears = experienceYears;
    }

    public int getPatientCount() {
        return patientCount;
    }

    public void setPatientCount(int patientCount) {
        this.patientCount = patientCount;
    }
}
