package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long appointmentId;

    private Double amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String method;

    
// ✅ NEW FIELDS (Safe Addition)
    private Double hospitalShare;   // 30%
    private Double doctorShare;     // 70%

}