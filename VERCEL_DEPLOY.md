# Vercel Deployment

This project deploys the React/Vite frontend to Vercel. The .NET backend should be hosted separately, then connected with an environment variable.

## Vercel settings

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `frontend/dist`

These are already configured in `vercel.json`.

## Environment variable

Add this variable in Vercel Project Settings:

```text
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

Replace `https://your-backend-domain.com` with your deployed backend URL.

## Deploy

```bash
npm run build
```

Then push the project to GitHub and import it into Vercel, or run:

```bash
vercel
vercel --prod
```

After deployment, test:

- Login/Register
- Books page
- Borrow request
- Buy/checkout request
- Admin approvals
- My Books dashboard
