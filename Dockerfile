# ── Backend (FastAPI + Uvicorn) ──────────────────────────────────────
FROM python:3.11-slim AS backend

WORKDIR /app/backend

# Install system deps for xhtml2pdf
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


# ── Frontend (Vite build → nginx) ───────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build


# ── Production image — nginx serves frontend, proxies /api to backend ─
FROM nginx:alpine AS production

# Copy custom Nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend build output
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
