# AI Quest Platform - Production Deployment & Operations Guide

Welcome to the production deployment and orchestration blueprints folder. This guide details how to install, manage, scale, and back up the **AI Quest Platform** in modern high-concurrency environments.

---

## 📂 Deployment Folder Structure
Our configuration files are modularly isolated for enterprise clarity:
```bash
deployment/
├── docker/
│   └── Dockerfile          # Optimized multi-stage node builder
├── compose/
│   └── docker-compose.yml  # Local single-node production blueprint
├── k8s/
│   └── deployment.yaml     # Native Kubernetes resources (HPA, PVC, Ingress)
├── helm/
│   ├── Chart.yaml          # Helm Chart metadata
│   └── values.yaml         # Deeply configurable Helm properties mapping
├── nginx/
│   └── nginx.conf          # Nginx reverse proxy, caching, Gzip & WebSocket configuration
├── traefik/
│   └── traefik.yml         # Traefik router, TLS 1.3 & Let's Encrypt setup
├── monitoring/
│   ├── prometheus.yml      # Prometheus telemetry scraping rule configurations
│   ├── alerts.yml          # Metric alert limits (PostgreSQL, Redis, CPU stress)
│   └── tempo.yaml          # Distributed trace tracker
├── backup/
│   ├── backup.sh           # S3 backup and pg_dump rotation scheduler
│   └── restore.sh          # Catastrophic disaster database recoverer
└── scripts/
    ├── install.sh          # One-click platform bootstrapper
    ├── update.sh           # Zero-downtime rolling update executor
    └── healthcheck.sh      # Core microservice and socket cluster scanner
```

---

## ⚡ 1. One-Click Single-Node Quickstart (Docker Compose)
To launch the entire platform, including database persistence, telemetry engines, reverse proxies, and S3 buckets:

1. Clone this repository to your target server.
2. Grant execution permission to setup scripts:
   ```bash
   chmod +x deployment/scripts/*.sh deployment/backup/*.sh
   ```
3. Run the bootloader script:
   ```bash
   ./deployment/scripts/install.sh
   ```

The script will build multi-stage Docker layers, create persistent volumes, run migrations, and launch Nginx routing to port 80/443.

---

## ☸️ 2. Multi-Replica Orchestration (Kubernetes & Helm)
For cloud-scale load-balanced environments with automatic scaling, we provide both native K8s manifests and a customizable Helm Chart.

### Option A: Native Manifests
Apply configurations directly via `kubectl`:
```bash
kubectl apply -f deployment/k8s/deployment.yaml
```

### Option B: Helm Package Management
Install with customized parameters:
```bash
# Verify dry-run template variables binding
helm install quest-release ./deployment/helm --dry-run --debug

# Install directly into production cluster
helm install quest-release ./deployment/helm -f ./deployment/helm/values.yaml
```

---

## 🔄 3. Rolling Updates & Zero-Downtime Rollbacks
We use Kubernetes Rolling Update strategy or Compose double-reloading to prevent player disconnects during updates.

- **To update the live cluster without downtime:**
  ```bash
  ./deployment/scripts/update.sh
  ```
- **Automated Rollback Rule:**
  If a newly deployed container fails its `/api/health` readiness probe (due to an unhandled exception or missing API key), the Kubernetes scheduler or load-balancer stops routing traffic to the bad node and automatically reverts back to the last stable pod template.

---

## 📈 4. Horizontal Scaling & High Availability
To comfortably support **10,000+ simultaneous connections**:

- **Realtime WebSocket Scaling:** The Socket.IO gateway operates under a `redis-adapter` pool. When players scale horizontally across pods, event emissions are automatically synchronized via a Redis pub/sub channel.
- **Sticky Session Requirement:** Ensure your Ingress controller maintains stickiness annotations to preserve local HTTP-polling handshakes where WebSocket is temporarily blocked:
  ```yaml
  nginx.ingress.kubernetes.io/affinity: "cookie"
  nginx.ingress.kubernetes.io/session-cookie-name: "route"
  ```
- **Autoscaling Thresholds:** Our Horizontal Pod Autoscaler (HPA) triggers a replica scale-out (from 2 up to 10 pods) once cumulative CPU load crosses **75%**.

---

## 🛡️ 5. Security & TLS Hardening
We enforce enterprise-grade defense-in-depth principles:
1. **TLS 1.3 only:** Hardened cipher suites prevent legacy man-in-the-middle exploits.
2. **HSTS & OWASP Headers:** Content Security Policies (CSP), anti-clickjacking, and `X-Frame-Options` are configured natively inside NGINX.
3. **PWA Offline Integrity:** Core assets use hash verification to prevent file poisoning.

---

## 🗄️ 6. Automated Backups & Disaster Recovery
To guarantee user data safety and zero-data-loss integrity:

### Daily Automated Backup cron configuration:
```cron
0 2 * * * /app/deployment/backup/backup.sh >> /var/log/backup.log 2>&1
```

### Recovery execution:
In the event of database file damage:
```bash
./deployment/backup/restore.sh /var/backups/quest_platform/postgres_dump_latest.sql.gz /var/backups/quest_platform/minio_assets_latest.tar.gz
```
This restores all PostgreSQL schemas and physical MinIO S3 media folders.
