package com.example.demo.controller;

import com.example.demo.model.Payment;
import com.example.demo.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Payment REST Controller
 * -----------------------
 * Handles patient payment initiation and admin payment management.
 */
@CrossOrigin(origins = "http://localhost:5173") // ✅ FIXES CORS
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // =========================
    // CREATE PAYMENT (Patient)
    // =========================
    @PostMapping
    public Payment createPayment(@RequestBody Payment payment) {
        return paymentService.createPayment(payment);
    }

    // =========================
    // CONFIRM PAYMENT (Admin / System)
    // =========================
    @PostMapping("/confirm/{id}")
    public Payment confirmPayment(@PathVariable Long id) {
        return paymentService.confirmPayment(id);
    }

    // =========================
    // READ ALL PAYMENTS (Admin)
    // =========================
    @GetMapping("/admin/all")
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    // =========================
    // UPDATE PAYMENT (Admin)
    // =========================
    @PutMapping("/admin/update/{id}")
    public Payment updatePayment(@PathVariable Long id,
                                 @RequestBody Payment payment) {
        return paymentService.updatePayment(id, payment);
    }

    // =========================
    // DELETE PAYMENT (Admin)
    // =========================
    @DeleteMapping("/admin/delete/{id}")
    public void deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
    }
}