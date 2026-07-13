# Backend Deployment With Railway

The backend is an ASP.NET Core API. Vercel does not support ASP.NET Core as a normal backend runtime, so deploy the API to Railway with Docker, then connect the Vercel frontend to the Railway API URL.

This repo is prepared for Railway with:

- `backend/backend/Dockerfile`
- `railway.json`

## Required environment variables

Set these in Railway Variables:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=your-long-secret-key
AllowedOrigins=https://your-vercel-domain.vercel.app
```

## Railway steps

1. Push this repo to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Railway will use `railway.json` and `backend/backend/Dockerfile`.
4. Add the required environment variables in Railway Variables.
5. Deploy the service.
6. Open Railway service settings and generate a public domain.

After the backend is live, copy its URL and set this in Vercel:

```text
VITE_API_BASE_URL=https://your-railway-domain.up.railway.app/api
```

Then redeploy the Vercel frontend.

## Local build check

```bash
dotnet build backend/backend/backend.csproj --no-restore -c Release
```
