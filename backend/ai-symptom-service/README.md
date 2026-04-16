# AI Symptom Checker Service API

## POST /api/symptom-checker

Request Body (JSON):
```
{
  "symptoms": ["fever", "cough"]
}
```

Response (JSON):
```
{
  "suggestion": "You may have symptoms of flu. Please consult a General Physician.",
  "recommendedSpecialties": ["General Physician"]
}
```

- Integrate with a real AI/ML API or model in `SymptomCheckerService` for production use.
- Service runs on port 8087 by default.
