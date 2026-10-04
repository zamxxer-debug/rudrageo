# Rudra DRISHTI Platform

**Offline-First Tourist Safety, Digital Identity, Geofencing, and Emergency Response Platform for the Nilgiris.**

---

## Key Features & Architecture

- **Multi-Persona Emergency Portal**: Unified interface with custom workflows for **Tourists**, **Police HQ / Command Center**, **Community Guardians**, **Tourism Officers**, and **System Administrators**.
- **1-Click Instant Evaluator Mode**: Seamlessly switch and evaluate any persona with pre-configured Nilgiris geospatial telemetry.
- **Offline-First Resilience**: IndexedDB offline event queueing for SOS distress signals and crowdsourced hazard reporting that automatically synchronize when network is restored.
- **AI Risk Intelligence & Weather Telemetry**: Dynamic mountain hazard evaluations, landslide vulnerability ratings, and live sensor feeds.
- **Tamper-Evident Merkle Blockchain Ledger**: SHA-256 cryptographic audit trail recording all critical SOS and dispatch events.
- **Supabase PostgreSQL & Cloud Ready**: Production-ready connection pooling, auto-healing URI normalization, and full DDL schema (`backend/supabase_schema.sql`).
- **Vercel SPA Deployment**: Zero-config Single Page Application rewrites (`frontend/vercel.json`) and optimized chunk bundling.

---

## Local Development Quickstart

### 1. Backend API (FastAPI)
```powershell
cd backend
# Create virtual environment if needed
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Run server on port 8000
python -m uvicorn main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Web Application (React + Vite + Tailwind CSS)
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Demo Accounts & 1-Click Evaluator Mode

The demo database automatically seeds 5 distinct operational personas. You can log in via **1-Click Demo Launch** or manual credentials:

| Role | Persona Name | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Tourist** | Sophie Martin | `tourist@rudra.gov.in` | `Tourist@123` | Drishti ID QR Pass, Geofence Alerts, AI Assistant, 1-Tap SOS |
| **Police HQ** | Insp. R. Sundaram | `police@rudra.gov.in` | `Police@123` | Situational Map, Real-time Dispatch, Incident SLA Timeline |
| **Guardian** | Muthu Kumar | `guardian@rudra.gov.in` | `Guardian@123` | Sector Proximity Radar, Quick Responder Navigation, Badges |
| **Tourism Officer** | Priya Sharma | `tourism@rudra.gov.in` | `Tourism@123` | Visitor Footfall Meters, Zone Capacity, Geofence Alert Previews |
| **Administrator** | Super Admin | `admin@rudra.gov.in` | `Admin@123` | Supabase DB Ping Diagnostics, Merkle Ledger, User Governance |

---

## Supabase Database Integration

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy the PostgreSQL connection string from **Project Settings > Database > Connection String**. Use the Supabase Session Pooler string if the direct database host is not reachable from Render.
3. In the Render backend service, add these environment variables:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[SUPABASE-POOLER-HOST]:5432/postgres
   APP_ENV=production
   DEMO_MODE=false
   ```
   Replace the placeholders with the exact values shown by Supabase. Do not use the Supabase anon key or service-role key as `DATABASE_URL`.
4. Redeploy the Render service. On first startup, the backend creates its SQLAlchemy tables in the connected database. Use a new/empty Supabase database; the checked-in `backend/supabase_schema.sql` is not currently aligned with all ORM models and should not be run as the initial schema.
5. Confirm `https://rudrageo.onrender.com/health/database` reports `PostgreSQL (Supabase/Cloud)` and `durable_storage: true`.

If the existing Supabase database was initialized from the older SQL schema, run `backend/migrations/20261004_auth_schema_compat.sql` in the Supabase SQL Editor before testing authentication. This migration preserves existing rows while adding the auth columns expected by the current backend.

---

## Vercel Frontend Deployment

1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and select this repository.
3. Configure the **Root Directory** as `frontend`.
4. Add the Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-service.onrender.com/api` (or your deployed FastAPI URL).
5. Deploy! The included `frontend/vercel.json` ensures all client-side routes and deep links resolve seamlessly.

---

## Testing & Quality Assurance

- **Backend Unit & Integration Tests**:
  ```powershell
  cd backend
  python -m pytest
  ```
- **Frontend TypeScript & Build Verification**:
  ```powershell
  cd frontend
  npm run build
  ```

