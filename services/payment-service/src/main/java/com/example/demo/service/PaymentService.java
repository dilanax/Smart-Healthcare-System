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
    // CREATE
    // =========================
    public Payment initiatePayment(Long appointmentId, Double amount) {
        Payment payment = new Payment();
        payment.setAppointmentId(appointmentId);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setMethod("MOCK");

        return repository.save(payment);
    }

    // =========================
    // UPDATE (Confirm)
    // =========================
    public Payment confirmPayment(Long paymentId) {
        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(PaymentStatus.SUCCESS);
        return repository.save(payment);
    }

    // =========================
    // READ (Admin)
    // =========================
    public List<Payment> getAllPayments() {
        return repository.findAll();
    }

    // =========================
    // UPDATE – FULL (Admin)
    // =========================
    public Payment updatePayment(Long id, Payment updatedPayment) {
        Payment payment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (updatedPayment.getAmount() != null) {
            payment.setAmount(updatedPayment.getAmount());
        }

        if (updatedPayment.getStatus() != null) {
            payment.setStatus(updatedPayment.getStatus());
        }

        if (updatedPayment.getMethod() != null) {
            payment.setMethod(updatedPayment.getMethod());
        }

        return repository.save(payment);
    }

    // =========================
    // DELETE (Admin)
    // =========================
    public void deletePayment(Long id) {
        Payment payment = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        repository.delete(payment);
    }
}