# Smart Healthcare Kubernetes Setup

This folder adds Kubernetes manifests for:
- `mysql`
- `auth-service` (8081)
- `doctor-service` (8082)
- `patient-service` (8083)
- `notification-service` (8084)
- `appointment-service` (8085)
- `payment-service` (8086)
- `frontend` (5173)

## 1) Prerequisites

- Docker installed
- Kubernetes cluster running (`minikube`, Docker Desktop Kubernetes, or similar)
- `kubectl` configured

Check:

```powershell
kubectl cluster-info
kubectl get nodes
```

## 2) Build Docker Images

Run from repo root:

```powershell
docker build --no-cache -t smart-healthcare/auth-service:latest ./backend/auth-service
docker build --no-cache -t smart-healthcare/doctor-service:latest ./backend/doctor-service
docker build --no-cache -t smart-healthcare/patient-service:latest ./backend/patient-service
docker build --no-cache -t smart-healthcare/notification-service:latest ./backend/notification-service
docker build --no-cache -t smart-healthcare/appointment-service:latest ./backend/appointment-service
docker build --no-cache -t smart-healthcare/payment-service:latest ./backend/payment-service
docker build --no-cache -t smart-healthcare/frontend:latest ./frontend
```

If you use Minikube, also load images into the cluster after building them locally:

```powershell
minikube image load smart-healthcare/auth-service:latest
minikube image load smart-healthcare/doctor-service:latest
minikube image load smart-healthcare/patient-service:latest
minikube image load smart-healthcare/notification-service:latest
minikube image load smart-healthcare/appointment-service:latest
minikube image load smart-healthcare/payment-service:latest
minikube image load smart-healthcare/frontend:latest
```

If you use Docker Desktop Kubernetes, you usually do not need `minikube image load` because Kubernetes can use your local Docker images directly.

## 3) Apply Kubernetes Manifests

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/frontend.yaml
```

`k8s/services.yaml` already contains both the backend `Deployment` and `Service` resources. `k8s/frontend.yaml` contains the frontend `Deployment` and `Service`.

## 4) Verify Pods and Services

```powershell
kubectl get pods -n smart-healthcare
kubectl get svc -n smart-healthcare
```

Wait until all pods are `Running`.

## 5) Access the App

The Kubernetes services are `ClusterIP`, so they are not reachable from your browser until you expose them locally.

Your frontend code currently calls APIs on `http://localhost:8081..8086`, so the easiest approach is port-forwarding:

```powershell
powershell -ExecutionPolicy Bypass -File .\k8s\port-forward.ps1
```

Then open:
- `http://localhost:5173`

## 6) Useful Commands

View logs:

```powershell
kubectl logs -n smart-healthcare deploy/auth-service
kubectl logs -n smart-healthcare deploy/appointment-service
kubectl logs -n smart-healthcare deploy/frontend
```

Restart any deployment:

```powershell
kubectl rollout restart deploy/appointment-service -n smart-healthcare
```

Delete all resources:

```powershell
kubectl delete namespace smart-healthcare
```

## Notes for Assignment

- This setup uses Kubernetes `Deployment + Service + Secret + PVC`.
- Database persistence is handled using `mysql-pvc`.
- Sensitive values are stored in `k8s/secret.yaml` for demo parity with your current compose setup.
- For production, move secrets to a secure secret manager and rotate credentials.

