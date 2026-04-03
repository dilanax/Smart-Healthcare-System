package com.example.demo.controller;

import com.example.demo.model.Payment;
import com.example.demo.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // =========================
    // CREATE (Patient)
    // =========================
    @PostMapping("/initiate")
    public Payment initiate(@RequestParam Long appointmentId,
                            @RequestParam Double amount) {
        return paymentService.initiatePayment(appointmentId, amount);
    }

    // =========================
    // UPDATE (System / Admin)
    // =========================
    @PostMapping("/confirm/{id}")
    public Payment confirm(@PathVariable Long id) {
        return paymentService.confirmPayment(id);
    }

    // =========================
    // READ (Admin)
    // =========================
    @GetMapping("/admin/all")
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    // =========================
    // UPDATE – FULL (Admin)
    // =========================
    @PutMapping("/admin/update/{id}")
    public Payment updatePayment(@PathVariable Long id,
                                 @RequestBody Payment payment) {
        return paymentService.updatePayment(id, payment);
    }

    // =========================
    // DELETE (Admin)
    // =========================
    @DeleteMapping("/admin/delete/{id}")
    public void deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
    }
}