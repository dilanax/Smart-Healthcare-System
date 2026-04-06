import { useEffect, useState } from "react";
import Navbar from "../components/navbar";

const PaymentPage = ({ navigate }) => {
  const [payment, setPayment] = useState(null);

  // Payment method
  const [method, setMethod] = useState("CARD");

  // Card details (only used if CARD)
  const [cardType, setCardType] = useState("VISA");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Load payment info from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("paymentInfo");

    if (!stored) {
      navigate("/");
      return;
    }

    setPayment(JSON.parse(stored));
  }, [navigate]);

  if (!payment) return null;

 const handlePayment = async () => {
  try {
    await fetch("http://localhost:8083/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: payment.appointmentId,
        amount: payment.amount,
        method: method,
        status: method === "CASH" ? "PENDING" : "SUCCESS"
      }),
    });

    localStorage.removeItem("paymentInfo");
    alert("✅ Payment recorded successfully");
    navigate("/");
  } catch (err) {
    console.error(err);
    alert("❌ Payment failed, please try again");
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} />

      <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT: Appointment Summary */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Appointment Summary</h2>

          <p><b>Doctor:</b> {payment.doctor}</p>
          <p><b>Date:</b> {payment.date}</p>
          <p><b>Time:</b> {payment.time}</p>

          <p className="mt-4 text-lg font-semibold text-teal-700">
            Amount: LKR {payment.amount}
          </p>
        </div>

        {/* RIGHT: Payment */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Payment</h2>

          {/* Payment Method */}
          <label className="block mb-2 font-semibold">
            Payment Method
          </label>

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full border rounded-lg p-2 mb-4"
          >
            <option value="CARD">Card</option>
            <option value="CASH">Cash (Pay at Hospital)</option>
          </select>

          {/* Card Details – ONLY IF CARD */}
          {method === "CARD" && (
            <>
              <label className="block mb-1 font-semibold">
                Card Type
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full border rounded-lg p-2 mb-3"
              >
                <option value="VISA">VISA</option>
                <option value="MASTERCARD">MasterCard</option>
              </select>

              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full border rounded-lg p-2 mb-3"
              />

              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="border rounded-lg p-2"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="border rounded-lg p-2"
                />
              </div>
            </>
          )}

          {/* Confirm Button */}
          <button
            onClick={handlePayment}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;