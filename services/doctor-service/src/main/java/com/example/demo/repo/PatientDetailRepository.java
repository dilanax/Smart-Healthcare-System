package com.example.demo.repo;

import com.example.demo.model.PatientDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PatientDetailRepository extends JpaRepository<PatientDetail, Long> {
    Optional<PatientDetail> findByEmail(String email);
}
