import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { sendAppointmentSuccessNotification } from "../lib/notifications";

const PaymentPage = ({ navigate }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load payment info saved after appointment booking
  useEffect(() => {
    const stored = localStorage.getItem("paymentInfo");

    if (!stored) {
      navigate("/");
      return;
    }

    setPayment(JSON.parse(stored));
  }, [navigate]);

  if (!payment) return null;

  const triggerAppointmentNotification = async (paymentMethod) => {
    const payload = {
      eventType: "APPOINTMENT_BOOKED",
      appointmentId: Number(payment.appointmentId),
      eventTime: new Date().toISOString(),
      details: `Appointment confirmed via ${paymentMethod}. Date: ${payment.date} ${payment.time}`,
      patient: {
        name: payment.patientName || "Patient",
        email: payment.patientEmail || "patient@healthcare.local",
        phone: payment.patientPhone || "+94000000001",
      },
      doctor: {
        name: payment.doctor || "Doctor",
        email: payment.doctorEmail || "doctor@healthcare.local",
        phone: payment.doctorPhone || "+94000000000",
      },
    };

    try {
      await sendAppointmentSuccessNotification(payload);
    } catch (error) {
      console.error("Notification trigger failed:", error);
    }
  };

  const handleSuccessfulPayment = () => {
    localStorage.removeItem("paymentInfo");
    navigate("/");
  };

  // ================================
  // PAYHERE PAYMENT (ONLINE / CARD)
  // ================================
  const handlePayHerePayment = async () => {
    try {
      setLoading(true);

      const orderId = `APT_${payment.appointmentId}`;

      // 1️⃣ Fetch hash from backend
      const response = await fetch(
        "http://localhost:8086/payments/payhere-hash",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            amount: payment.amount,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PayHere hash");
      }

      const hash = await response.text();
      
      
      await fetch("http://localhost:8086/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: payment.appointmentId,
        amount: payment.amount,
        method: "PAYHERE_TEST",
        status: "PENDING",
      }),
    });

      if (!hash) {
        throw new Error("Payment hash was empty.");
      }

      payhere.onCompleted = async () => {
        setLoading(false);
        await triggerAppointmentNotification("PAYHERE");
        setPaymentNotice("Payment completed successfully.");
        handleSuccessfulPayment();
      };

      payhere.onDismissed = () => {
        setLoading(false);
        setPaymentError("Payment window was closed before completion.");
      };

      payhere.onError = (error) => {
        setLoading(false);
        setPaymentError(
          typeof error === "string" && error.trim()
            ? error
            : "PayHere could not start the payment."
        );
      };

      // 2️⃣ Start PayHere checkout
      payhere.startPayment({
     // 2️⃣ Start PayHere checkout
      window.payhere.startPayment({
        sandbox: true,
        merchant_id: "1235016",

        return_url: "http://localhost:5173/",
        cancel_url: "http://localhost:5173/",
        notify_url: "http://localhost:8086/payments/payhere-notify",

        order_id: orderId,
        items: "Doctor Appointment",
        amount: payment.amount,
        currency: "LKR",

        first_name: "Test",
        last_name: "User",
        email: "test@payhere.com",
        phone: "0771234567",
        address: "Colombo",
        city: "Colombo",
        country: "Sri Lanka",

        hash: hash,
      });
    } catch (err) {
      console.error(err);
      alert("❌ Unable to start PayHere payment");
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // CASH PAYMENT (OFFLINE)
  // ================================
  const handleCashPayment = async () => {
    try {
      await fetch("http://localhost:8086/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: payment.appointmentId,
          amount: payment.amount,
          method: "CASH",
          status: "PENDING",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to register cash payment.");
      }

      await triggerAppointmentNotification("CASH");
      localStorage.removeItem("paymentInfo");
      alert("✅ Appointment booked. Please pay cash at the hospital.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to register cash payment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} />

      <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: Appointment Summary */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Appointment Summary</h2>

          <p>
            <b>Doctor:</b> {payment.doctor}
          </p>
          <p>
            <b>Date:</b> {payment.date}
          </p>
          <p>
            <b>Time:</b> {payment.time}
          </p>

          <p className="mt-4 text-lg font-semibold text-teal-700">
            Amount: LKR {payment.amount}
          </p>
        </div>

        {/* RIGHT: Payment Options */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Payment</h2>

          <p className="mb-4 text-sm text-gray-600">
            Choose how you want to pay for your appointment.
          </p>

          {/* PayHere */}
          <button
            onClick={handlePayHerePayment}
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "💳 Pay with PayHere (Test)"}
          </button>

          {/* Cash */}
          <button
            onClick={handleCashPayment}
            className="w-full mt-3 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300"
          >
            💵 Pay Cash at Hospital
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;