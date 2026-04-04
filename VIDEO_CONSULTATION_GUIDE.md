# Video Consultation Feature - Integration Guide

## Overview
This guide describes the video consultation feature implementation for doctors to create, manage, and edit video consultation sessions with automatic link generation and category selection.

## Frontend Features

### 1. **Auto-Generate Video Links**
- Click the "Generate Link" button in the consultation form
- Links are generated based on the selected platform:
  - Google Meet: `https://meet.google.com/{randomCode}`
  - Zoom: `https://zoom.us/j/{randomCode}`
  - Microsoft Teams: `https://teams.microsoft.com/l/meetup-join/{randomCode}`
  - SmartCare Video: `https://smartcare-video.healthcare/room/{randomCode}`

### 2. **Category Selection**
Available consultation categories:
- General Consultation
- Follow-up
- Emergency
- Urgent Care
- Routine Check-up
- Post-Surgery
- Specialist Referral

### 3. **Edit/Manage Consultations**
- Click "Edit" button on any scheduled consultation card
- Edit modal allows updating all consultation details
- Change or regenerate meeting links using the "Regenerate" button
- Save changes or cancel the edit operation

## Backend API Endpoints

### Create Video Consultation
```
POST /api/video-consultations
Content-Type: application/json

{
  "doctorId": 1,
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "consultationDate": "2026-04-15",
  "consultationTime": "14:30",
  "duration": 30,
  "platform": "Google Meet",
  "meetingLink": "https://meet.google.com/abc123",
  "category": "General Consultation",
  "notes": "Initial consultation",
  "status": "Scheduled"
}
```

### Get Doctor's Consultations
```
GET /api/video-consultations/doctor/{doctorId}
```

### Get Scheduled Consultations
```
GET /api/video-consultations/doctor/{doctorId}/scheduled
```

### Get Consultations by Date
```
GET /api/video-consultations/doctor/{doctorId}/date?date=2026-04-15
```

### Update Consultation
```
PUT /api/video-consultations/{id}
Content-Type: application/json

{
  "doctorId": 1,
  "patientName": "John Doe",
  "patientEmail": "john@example.com",
  "consultationDate": "2026-04-15",
  "consultationTime": "15:00",
  "duration": 45,
  "platform": "Zoom",
  "meetingLink": "https://zoom.us/j/xyz789",
  "category": "Follow-up",
  "notes": "Follow-up consultation",
  "status": "Scheduled"
}
```

### Update Meeting Link Only
```
PUT /api/video-consultations/{id}/meeting-link?newLink=https://new-meeting-link.com
```

### Generate Meeting Link
```
POST /api/video-consultations/generate-link?platform=Google Meet
```

### Delete Consultation
```
DELETE /api/video-consultations/{id}
```

## Database Schema

### video_consultations table
```sql
CREATE TABLE video_consultations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  doctor_id BIGINT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_email VARCHAR(255) NOT NULL,
  consultation_date DATE NOT NULL,
  consultation_time TIME NOT NULL,
  duration INT NOT NULL,
  platform VARCHAR(100) NOT NULL,
  meeting_link VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  notes VARCHAR(1000),
  status VARCHAR(50) NOT NULL,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);
```

## Implementation Status

✅ Frontend: Doctor Dashboard with all features
- ✅ Create video consultations
- ✅ Auto-generate meeting links
- ✅ Select consultation category
- ✅ Edit/manage consultations
- ✅ Delete consultations
- ✅ View all scheduled consultations

✅ Backend: Doctor Service API
- ✅ VideoConsultation entity with JPA
- ✅ VideoConsultationService with business logic
- ✅ VideoConsultationController with REST endpoints
- ✅ VideoConsultationRepository with custom queries

## How to Use

### For Doctors:

1. **Create a Consultation**
   - Navigate to the Telemedicine tab in your dashboard
   - Fill in patient details (name, email)
   - Select date and time
   - Choose platform (Google Meet, Zoom, Microsoft Teams, SmartCare Video)
   - Set duration
   - Select consultation category
   - Either paste a meeting link or click "Generate Link"
   - Add optional notes
   - Click "Create video consultation"

2. **Edit a Consultation**
   - View your scheduled consultations in the "Session Queue"
   - Click the "Edit" button on any consultation
   - Update any details in the edit modal
   - Click "Regenerate" to change the meeting link
   - Click "Update Consultation" to save changes

3. **Delete a Consultation**
   - Click the "Delete" button on any consultation
   - The consultation will be removed from your schedule

## Data Storage
- Frontend: Uses localStorage with email-based keys
- Backend: Uses PostgreSQL/MySQL database through Spring Data JPA
- Both systems maintain synchronization through API calls

## Future Enhancements
- Email notifications to patients
- Calendar integration
- Recurring consultations
- Patient video consultation history
- Consultation recordings
- Post-consultation follow-ups
