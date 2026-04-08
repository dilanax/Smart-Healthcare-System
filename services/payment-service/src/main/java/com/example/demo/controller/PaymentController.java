package com.example.demo.controller;

import com.example.demo.model.Payment;
import com.example.demo.model.PaymentStatus;
import com.example.demo.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ✅ PayHere credentials (from application.properties)
    @Value("${payhere.merchant.id}")
    private String merchantId;

    @Value("${payhere.merchant.secret}")
    private String merchantSecret;

    // ====================================================
    // ⚠️ MANUAL PAYMENT (Admin / Testing only)
    // ====================================================
    @PostMapping
    public Payment createPayment(@RequestBody Payment payment) {
        return paymentService.createPayment(payment);
    }

    // ====================================================
    // ✅ PAYHERE HASH GENERATION (REQUIRED)
    // ====================================================
    @PostMapping("/payhere-hash")
    public String generatePayHereHash(@RequestBody Map<String, String> data) {

        String orderId = data.get("order_id");
        String amount = String.format(
                "%.2f", Double.parseDouble(data.get("amount"))
        );
        String currency = "LKR";

        // Step 1: Hash merchant secret
        String hashedSecret = md5Hex(merchantSecret).toUpperCase();

        // Step 2: Create hash string
        String hashString =
                merchantId + orderId + amount + currency + hashedSecret;

        // Step 3: Return final hash
        return md5Hex(hashString).toUpperCase();
    }

    private String md5Hex(String value) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("MD5");
            byte[] digest = messageDigest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();

            for (byte currentByte : digest) {
                hex.append(String.format("%02x", currentByte));
            }

            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("MD5 algorithm is not available.", exception);
        }
    }

    // ====================================================
    // ✅ PAYHERE CALLBACK (REAL GATEWAY CONFIRMATION)
    // ====================================================
    @PostMapping("/payhere-notify")
    public ResponseEntity<String> payHereNotify(
            @RequestParam("order_id") String orderId,
            @RequestParam("payhere_amount") String amount,
            @RequestParam("status_code") int statusCode) {

        // PayHere status_code = 2 means SUCCESS
        if (statusCode == 2) {
            Payment payment = new Payment();

            payment.setAppointmentId(
                    Long.valueOf(orderId.replace("APT_", ""))
            );
            payment.setAmount(Double.valueOf(amount));
            payment.setMethod("PAYHERE_TEST");
            payment.setStatus(PaymentStatus.SUCCESS);

            paymentService.createPayment(payment);
        }

        return ResponseEntity.ok("OK");
    }

    // ====================================================
    // ✅ ADMIN ENDPOINTS
    // ====================================================
    @GetMapping("/admin/all")
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @PostMapping("/confirm/{id}")
    public Payment confirmPayment(@PathVariable Long id) {
        return paymentService.confirmPayment(id);
    }

    @PutMapping("/admin/update/{id}")
    public Payment updatePayment(
            @PathVariable Long id,
            @RequestBody Payment payment) {
        return paymentService.updatePayment(id, payment);
    }

    @DeleteMapping("/admin/delete/{id}")
    public void deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
    }
}