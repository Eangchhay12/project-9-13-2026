# Nexa Admin System

Small user administration system with login, authentication API, dashboard, user CRUD, Docker, MySQL, and Kubernetes.

## Stack

- Frontend: React + Vite
- Backend: Laravel 13 + Sanctum
- Database: MySQL 8.4
- Container: Docker Compose
- Deploy: Kubernetes manifests in `k8s/`
- Terminal: Windows PowerShell

## Run with Docker Desktop

```powershell
Copy-Item backend\.env.example backend\.env
docker compose up --build
```

Open `http://localhost:5173`. Demo login: `sokha@example.com` / `password`.

Stop services:

```powershell
docker compose down
```

## Local frontend only

```powershell
Set-Location frontend
npm.cmd install
npm.cmd run dev
```

The frontend includes a local demo fallback and persists CRUD changes in browser localStorage. The Laravel API is available at `http://localhost:8000/api` when Docker is running.

## Kubernetes

Build images and load them into your local cluster, then apply manifests:

```powershell
docker build -t nexa-admin-backend:latest .\backend
docker build -t nexa-admin-frontend:latest .\frontend
kubectl apply -f .\k8s\namespace.yaml
kubectl apply -f .\k8s\mysql.yaml
kubectl apply -f .\k8s\backend.yaml
kubectl apply -f .\k8s\frontend.yaml
kubectl get pods -n nexa-admin
kubectl get service frontend -n nexa-admin
```

For Minikube, run `minikube image load nexa-admin-backend:latest` and `minikube image load nexa-admin-frontend:latest` before applying workloads. Replace the placeholder `APP_KEY` in `k8s/backend.yaml` with a generated Laravel key for production.

## GitHub Pages Demo

The React frontend is configured to deploy automatically through `.github/workflows/deploy-frontend.yml`.

1. Create a GitHub repository and push this project to the `main` branch.
2. In GitHub, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and wait for `Deploy React frontend to GitHub Pages` to finish.
4. Share the Pages URL shown in the workflow deployment summary.

GitHub Pages hosts the frontend only. For real Laravel authentication, User CRUD, Salary CRUD, and MySQL data, deploy the backend separately on a VPS, Render, Railway, or Kubernetes and set `VITE_API_URL` to its public API URL before building.
