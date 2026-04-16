import React, { useState } from "react";

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: symptoms.split(",").map(s => s.trim()).filter(Boolean) })
      });
      if (!response.ok) throw new Error("Failed to get suggestion");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="symptom-checker">
      <h2>AI Symptom Checker</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Enter your symptoms (comma separated):
          <input
            type="text"
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="e.g. fever, cough"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Check Symptoms"}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h3>Suggestion</h3>
          <p>{result.suggestion}</p>
          <h4>Recommended Specialties:</h4>
          <ul>
            {result.recommendedSpecialties.map((spec, idx) => (
              <li key={idx}>{spec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
