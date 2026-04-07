package com.example.demo.repository;

import com.example.demo.entity.VideoConsultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface VideoConsultationRepository extends JpaRepository<VideoConsultation, Long> {

    List<VideoConsultation> findByDoctorId(Long doctorId);

    List<VideoConsultation> findByDoctorIdOrderByConsultationDateDesc(Long doctorId);

    List<VideoConsultation> findByPatientEmailIgnoreCase(String patientEmail);

    @Query("SELECT vc FROM VideoConsultation vc WHERE vc.doctor.id = :doctorId AND vc.consultationDate = :date ORDER BY vc.consultationTime")
    List<VideoConsultation> findByDoctorIdAndConsultationDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    @Query("SELECT vc FROM VideoConsultation vc WHERE vc.doctor.id = :doctorId AND vc.status = 'Scheduled' ORDER BY vc.consultationDate, vc.consultationTime")
    List<VideoConsultation> findScheduledConsultationsByDoctorId(@Param("doctorId") Long doctorId);

    long countByDoctorId(Long doctorId);

    long countByDoctorIdAndStatus(Long doctorId, String status);
}
