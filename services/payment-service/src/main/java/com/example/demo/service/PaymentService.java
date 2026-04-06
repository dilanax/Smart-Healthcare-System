package com.example.demo.service;

import com.example.demo.model.Payment;
import com.example.demo.model.PaymentStatus;
import com.example.demo.repo.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository repository;

    // =========================
    // CREATE PAYMENT (Patient)
    // =========================
   public Payment createPayment(Payment payment) {

    // Example logic: fee based on doctorId (or appointmentId)
    Double fee = 2500.0; // default

    // TEMP logic (for demo / assignment)
    if (payment.getAppointmentId() % 3 == 0) {
        fee = 3000.0;
    } else if (payment.getAppointmentId() % 2 == 0) {
        fee = 3500.0;
    }

    payment.setAmount(fee);

    if ("CASH".equalsIgnoreCase(payment.getMethod())) {
        payment.setStatus(PaymentStatus.PENDING);
    } else {
        payment.setStatus(PaymentStatus.SUCCESS);
    }

    return repository.save(payment);
}

    // =========================
    // CONFIRM PAYMENT (Admin)
    // =========================
    public Payment confirmPayment(Long paymentId) {
        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(PaymentStatus.SUCCESS);
        return repository.save(payment);
    }

    // =========================
    // READ ALL PAYMENTS (Admin)
    // =========================
    public List<Payment> getAllPayments() {
        return repository.findAll();
    }

    // =========================
    // UPDATE PAYMENT (Admin)
    // =========================
    public Payment updatePayment(Long id, Payment updatedPayment) {
        Payment payment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (updatedPayment.getAmount() != null) {
            payment.setAmount(updatedPayment.getAmount());
        }

        if (updatedPayment.getMethod() != null) {
            payment.setMethod(updatedPayment.getMethod());
        }

        if (updatedPayment.getStatus() != null) {
            payment.setStatus(updatedPayment.getStatus());
        }

        return repository.save(payment);
    }

    // =========================
    // DELETE PAYMENT (Admin)
    // =========================
    public void deletePayment(Long id) {
        Payment payment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        repository.delete(payment);
    }
}