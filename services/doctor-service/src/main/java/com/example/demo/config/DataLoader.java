package com.example.demo.config;

import com.example.demo.model.Doctor;
import com.example.demo.repo.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private DoctorRepository doctorRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only insert if no doctors exist
        if (doctorRepository.count() == 0) {
            doctorRepository.save(new Doctor(0, "John", "Smith", "Cardiology", 5.0, 10, 5000));
            doctorRepository.save(new Doctor(0, "Emily", "Johnson", "Neurology", 4.8, 8, 3500));
            doctorRepository.save(new Doctor(0, "David", "Williams", "Orthopedics", 4.9, 12, 4200));
            doctorRepository.save(new Doctor(0, "Sarah", "Brown", "Pediatrics", 5.0, 7, 2800));
            System.out.println("Sample doctors inserted successfully!");
        }
    }
}
