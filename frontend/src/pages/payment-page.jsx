import { useEffect, useState } from "react";
import Navbar from "../components/navbar";

const PAYMENT_API_BASE_URL =
  import.meta.env.VITE_PAYMENT_API_BASE_URL?.trim() || "http://localhost:8096";
const NOTIFICATION_API_BASE_URL =
  import.meta.env.VITE_NOTIFICATION_API_BASE_URL?.trim() || "http://localhost:8094";
const PAYHERE_SDK_URL = "https://www.payhere.lk/lib/payhere.js";

const loadPayHereSdk = () => {
  if (window.payhere?.startPayment) {
    return Promise.resolve(window.payhere);
  }

  const existingScript = document.querySelector('script[src="https://www.payhere.lk/lib/payhere.js"]');

  if (existingScript) {
    return new Promise((resolve, reject) => {
      const handleLoad = () => resolve(window.payhere);
      const handleError = () => reject(new Error("Unable to load the PayHere SDK."));

      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });

      window.setTimeout(() => {
        if (window.payhere?.startPayment) {
          resolve(window.payhere);
        } else {
          reject(new Error("PayHere SDK is not ready yet. Please try again."));
        }
      }, 1500);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAYHERE_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.payhere?.startPayment) {
        resolve(window.payhere);
        return;
      }

      reject(new Error("PayHere SDK loaded, but the payment API is unavailable."));
    };
    script.onerror = () => reject(new Error("Unable to load the PayHere SDK."));
    document.body.appendChild(script);
  });
};

const PaymentPage = ({ navigate }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");

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
      await fetch(`${NOTIFICATION_API_BASE_URL}/api/notifications/events/appointment-success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
    setPaymentError("");
    setPaymentNotice("");
    setLoading(true);

    try {
      const payhere = await loadPayHereSdk();

      const orderId = `APT_${payment.appointmentId}`;
      const amount = Number(payment.amount).toFixed(2);

      // 1️⃣ Fetch hash from backend
      const response = await fetch(
        `${PAYMENT_API_BASE_URL}/payments/payhere-hash`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            amount,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate PayHere hash.");
      }

      const hash = (await response.text()).trim();

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
        sandbox: true,
        merchant_id: "1235016",

        return_url: `${window.location.origin}/`,
        cancel_url: `${window.location.origin}/`,
        notify_url: `${PAYMENT_API_BASE_URL}/payments/payhere-notify`,

        order_id: orderId,
        items: "Doctor Appointment",
        amount,
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
      setLoading(false);
      setPaymentError(err instanceof Error ? err.message : "Unable to start PayHere payment.");
    }
  };

  // ================================
  // CASH PAYMENT (OFFLINE)
  // ================================
  const handleCashPayment = async () => {
    setPaymentError("");
    setPaymentNotice("");

    try {
      const response = await fetch(`${PAYMENT_API_BASE_URL}/payments`, {
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
      setPaymentNotice("Appointment booked. Please pay cash at the hospital.");
      navigate("/");
    } catch (err) {
      console.error(err);
      setPaymentError(err instanceof Error ? err.message : "Failed to register cash payment.");
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

          {paymentError ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {paymentError}
            </div>
          ) : null}

          {paymentNotice ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {paymentNotice}
            </div>
          ) : null}

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