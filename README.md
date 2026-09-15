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
2. Obtain your PostgreSQL Connection URI from **Project Settings > Database > Connection String > URI**.
3. In `backend/.env` (or cloud environment settings), set:
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. *Optional Manual Schema*: You can execute `backend/supabase_schema.sql` directly inside the **Supabase SQL Editor** to initialize all tables, foreign keys, and indexes.
5. In the **Admin Portal**, use the **Test Connection** button to verify latency and connected tables.

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

