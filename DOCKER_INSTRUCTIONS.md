# 🐳 Docker Setup Instructions

## Prerequisites
- ✅ Docker installed ([Download Docker](https://www.docker.com/products/docker-desktop))
- ✅ Docker Compose installed (included with Docker Desktop)
- ✅ At least 4GB RAM allocated to Docker

## Quick Start

### 1. Navigate to Project Root
```bash
cd "C:\Users\dilan\OneDrive\Desktop\sample\Smart-Healthcare-System"
```

### 2. Build All Services
```bash
docker-compose build
```

This builds:
- ✅ MySQL Database (8.0)
- ✅ Auth Service (port 8083)
- ✅ Doctor Service (port 8083)
- ✅ Appointment Service (port 8083)
- ✅ Frontend React App (port 5173)

### 3. Start All Services
```bash
docker-compose up
```

Or run in background:
```bash
docker-compose up -d
```

### 4. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Auth API | http://localhost:8083 |
| Doctor API | http://localhost:8083 |
| Appointment API | http://localhost:8083 |
| MySQL | localhost:3306 |

### 5. Stop All Services
```bash
docker-compose down
```

Or keep volumes:
```bash
docker-compose down -v
```

---

## Useful Commands

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend
docker-compose logs auth-service
docker-compose logs doctor-service
docker-compose logs appointment-service

# Follow logs
docker-compose logs -f frontend
```

### Restart a Service
```bash
docker-compose restart auth-service
```

### Rebuild and Restart
```bash
docker-compose up --build auth-service
```

### Execute Command in Container
```bash
# MySQL
docker-compose exec mysql mysql -u healthcare -p123456 -D healthcare_db

# Backend service logs inside container
docker-compose exec auth-service bash
```

### List Running Containers
```bash
docker-compose ps
```

---

## Troubleshooting

### Port Already in Use
```bash
# Windows: Find process using port
netstat -ano | findstr :8083

# Kill process
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Check MySQL logs
docker-compose logs mysql

# Verify MySQL is running
docker-compose ps mysql
```

### Frontend Not Loading
```bash
# Rebuild frontend
docker-compose up --build frontend

# Check frontend logs
docker-compose logs -f frontend
```

### Clear Everything and Restart
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## Database Access

### Using MySQL Client
```bash
docker-compose exec mysql mysql -u healthcare -p123456 -D healthcare_db

# Then run SQL queries:
# SHOW TABLES;
# SELECT * FROM users;
# SELECT * FROM appointments;
```

### Using DBeaver/MySQL Workbench
- **Host:** localhost
- **Port:** 3306
- **Username:** healthcare
- **Password:** 123456
- **Database:** healthcare_db

---

## Development Tips

### Hot Reload Frontend
Frontend automatically rebuilds on code changes when running with `npm run dev`

### Backend Changes
After modifying Java code, rebuild the service:
```bash
docker-compose up --build auth-service
```

### Environment Variables
Edit `docker-compose.yml` to change ports, database credentials, etc.

---

## Production Deployment

For production, consider:
1. Use `.env` file for secrets (not in docker-compose.yml)
2. Set `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` (not `update`)
3. Configure persistent volumes for MySQL
4. Use reverse proxy (Nginx)
5. Enable HTTPS/SSL

---

## Next Steps

1. ✅ Run `docker-compose up`
2. ✅ Visit http://localhost:5173
3. ✅ Register as admin user
4. ✅ Login and access admin dashboard
5. ✅ Manage appointments, doctors, users

🎉 **Everything is containerized and ready to deploy!**
