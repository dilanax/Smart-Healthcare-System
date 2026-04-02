package com.example.demo.config;

import com.example.demo.entity.Patient;
import com.example.demo.entity.PatientStatus;
import com.example.demo.repository.PatientRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.util.List;

@Configuration
public class PatientSeedData {

    @Bean
    ApplicationRunner seedPatients(PatientRepository patientRepository) {
        return args -> {
            if (patientRepository.count() > 0) {
                return;
            }

            patientRepository.saveAll(List.of(
                    Patient.builder()
                            .fullName("Anjalie Fernando")
                            .email("anjalie.fernando@email.com")
                            .phoneNumber("+94 77 333 1122")
                            .dateOfBirth(LocalDate.of(1992, 5, 14))
                            .gender("Female")
                            .bloodGroup("A+")
                            .medicalConditions(List.of("Hypertension"))
                            .emergencyContactName("Ruwan Fernando")
                            .emergencyContactPhone("+94 71 998 7766")
                            .assignedDoctor("Dr. Sadun Perera")
                            .address("22 Lake Road, Colombo")
                            .status(PatientStatus.ACTIVE)
                            .build(),
                    Patient.builder()
                            .fullName("Kasun Rajapaksha")
                            .email("kasun.rajakapsha@email.com")
                            .phoneNumber("+94 76 220 1144")
                            .dateOfBirth(LocalDate.of(1985, 9, 3))
                            .gender("Male")
                            .bloodGroup("B+")
                            .medicalConditions(List.of("Diabetes", "Asthma"))
                            .emergencyContactName("Nimali Rajapaksha")
                            .emergencyContactPhone("+94 77 440 9911")
                            .assignedDoctor("Dr. Nethmi Silva")
                            .address("17 Temple Lane, Kandy")
                            .status(PatientStatus.CRITICAL)
                            .build(),
                    Patient.builder()
                            .fullName("Mihiri Senanayake")
                            .email("mihiri.senanayake@email.com")
                            .phoneNumber("+94 75 667 8822")
                            .dateOfBirth(LocalDate.of(2001, 12, 20))
                            .gender("Female")
                            .bloodGroup("O-")
                            .medicalConditions(List.of("Post-surgery review"))
                            .emergencyContactName("Suresh Senanayake")
                            .emergencyContactPhone("+94 70 113 5588")
                            .assignedDoctor("Dr. Kavindu Fernando")
                            .address("9 Galle Face Terrace, Colombo")
                            .status(PatientStatus.DISCHARGED)
                            .build()
            ));
        };
    }
}
