# Rudra DRISHTI

Offline-first tourist safety, digital identity, geofencing, and emergency response platform for the Nilgiris.

## Local development

1. Copy `.env.example` to `.env` and set a local `SECRET_KEY`.
2. Start the API:

   ```powershell
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

3. Start the frontend in a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

Open `http://localhost:5173`.

## Supabase readiness

The current default is the existing backend JWT flow with SQLite for local development. To move the database to Supabase, set `DATABASE_URL` in `.env` to a Supabase PostgreSQL URL using the `postgresql+psycopg2` SQLAlchemy scheme. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `AUTH_PROVIDER` are already reserved for the upcoming Supabase Auth/data integration. Never commit `.env` or service-role keys.

## Production checks

- Set `DEBUG=false`, `DEMO_MODE=false`, and a unique `SECRET_KEY`.
- Restrict `CORS_ORIGINS` to the deployed frontend origin.
- Provide the frontend `VITE_API_BASE_URL` when the API is hosted separately.
- Run `npm run build` from `frontend` before deployment.

## Git remote setup

This workspace is ready for initialization and pushing:

```powershell
git init
git add .
git commit -m "Prepare Rudra platform for deployment"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```
