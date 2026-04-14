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
            doctorRepository.save(new Doctor(null, "John", "Smith", "Cardiology", "Cardiology", "Asiri Central Hospital",
                "john.smith@healthcare.local", "+94770000011",
                "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80", "Available Today", 2500.0,
                5.0, 10, 5000));
            doctorRepository.save(new Doctor(null, "Emily", "Johnson", "Neurology", "Neurology", "Colombo Hospital",
                "emily.johnson@healthcare.local", "+94770000012",
                "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80", "Available Tomorrow", 3000.0,
                4.8, 8, 3500));
            doctorRepository.save(new Doctor(null, "David", "Williams", "Orthopedics", "Orthopedics", "Kandy Medical Center",
                "david.williams@healthcare.local", "+94770000013",
                "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80", "Available Today", 2800.0,
                4.9, 12, 4200));
            doctorRepository.save(new Doctor(null, "Sarah", "Brown", "Pediatrics", "Pediatrics", "Galle Hospital",
                "sarah.brown@healthcare.local", "+94770000014",
                "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80", "Available Today", 2600.0,
                5.0, 7, 2800));
            System.out.println("Sample doctors inserted successfully!");
        }
    }
}
