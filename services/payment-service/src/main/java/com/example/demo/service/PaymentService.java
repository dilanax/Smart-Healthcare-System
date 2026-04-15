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
    // CREATE PAYMENT (Gateway / Admin)
    // =========================
    public Payment createPayment(Payment payment) {

        // ✅ Calculate hospital & doctor shares
      applyRevenueSplit(payment);

        // ✅ DO NOT override amount or status
        // PayHere / controller decides these values
        return repository.save(payment);
    }

    // =========================
    // CONFIRM PAYMENT (Admin – Cash)
    // =========================
    public Payment confirmPayment(Long paymentId) {
        Payment payment = repository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(PaymentStatus.SUCCESS);
        applyRevenueSplit(payment);
        return repository.save(payment);
    }

    public void confirmPayHerePayment(Long appointmentId, Double amount) {

    Payment payment = repository.findAll().stream()
            .filter(p ->
                    p.getAppointmentId().equals(appointmentId) &&
                    p.getStatus() == PaymentStatus.PENDING &&
                    "PAYHERE_TEST".equals(p.getMethod())
            )
            .findFirst()
            .orElseThrow(() ->
                    new RuntimeException("Pending PayHere payment not found")
            );

    payment.setAmount(amount);
    payment.setStatus(PaymentStatus.SUCCESS);
    applyRevenueSplit(payment);

    repository.save(payment);
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

        applyRevenueSplit(payment);

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

    private void applyRevenueSplit(Payment payment) {
    if (payment.getAmount() == null) return;

    double total = payment.getAmount();
    payment.setHospitalShare(total * 0.30);
    payment.setDoctorShare(total * 0.70);
}

}