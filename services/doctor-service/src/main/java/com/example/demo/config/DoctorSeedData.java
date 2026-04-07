package com.example.demo.config;

import com.example.demo.entity.Doctor;
import com.example.demo.entity.DoctorStatus;
import com.example.demo.repository.DoctorRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class DoctorSeedData {

    @Bean
    ApplicationRunner seedDoctors(DoctorRepository doctorRepository) {
        return args -> {
            if (doctorRepository.count() > 0) {
                return;
            }

            doctorRepository.saveAll(List.of(
                    Doctor.builder()
                            .fullName("Dr. Sadun Perera")
                            .email("sadun.perera@smarthealth.lk")
                            .phoneNumber("+94 77 111 2233")
                            .specialization("Cardiology")
                            .licenseNumber("SLMC-1001")
                            .department("Heart Care")
                            .roomNumber("D-201")
                            .experienceYears(12)
                            .consultationFee(new BigDecimal("6500.00"))
                            .status(DoctorStatus.ACTIVE)
                            .verified(true)
                            .availableDays(List.of("Monday", "Wednesday", "Friday"))
                            .biography("Leads the cardiac clinic and supports high-priority inpatient reviews.")
                            .build(),
                    Doctor.builder()
                            .fullName("Dr. Nethmi Silva")
                            .email("nethmi.silva@smarthealth.lk")
                            .phoneNumber("+94 71 555 8899")
                            .specialization("Pediatrics")
                            .licenseNumber("SLMC-1002")
                            .department("Child Wellness")
                            .roomNumber("P-105")
                            .experienceYears(8)
                            .consultationFee(new BigDecimal("5200.00"))
                            .status(DoctorStatus.ON_LEAVE)
                            .verified(true)
                            .availableDays(List.of("Tuesday", "Thursday"))
                            .biography("Focuses on outpatient pediatric care and chronic follow-up plans.")
                            .build(),
                    Doctor.builder()
                            .fullName("Dr. Kavindu Fernando")
                            .email("kavindu.fernando@smarthealth.lk")
                            .phoneNumber("+94 76 888 4422")
                            .specialization("Orthopedics")
                            .licenseNumber("SLMC-1003")
                            .department("Bone and Joint Unit")
                            .roomNumber("O-310")
                            .experienceYears(6)
                            .consultationFee(new BigDecimal("5800.00"))
                            .status(DoctorStatus.ACTIVE)
                            .verified(false)
                            .availableDays(List.of("Monday", "Saturday"))
                            .biography("Supports post-surgery reviews and rehabilitation case planning.")
                            .build()
            ));
        };
    }
}
