# Frontend Deployment With Netlify

Use Netlify if `vercel.app` is blocked or slow for some users.

## Netlify settings

- Build command: `npm run build`
- Publish directory: `frontend/dist`

These are already configured in `netlify.toml`.

## Environment variable

Add this in Netlify:

```text
VITE_API_BASE_URL=https://kaah-production.up.railway.app/api
```

If your Railway backend URL changes, replace the value with the new Railway API URL.

## Steps

1. Push this repo to GitHub.
2. Go to Netlify.
3. Add new site from Git.
4. Choose the repository.
5. Confirm build settings:
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
6. Add the environment variable above.
7. Deploy.

After deployment, copy the Netlify URL and add it to Railway:

```text
AllowedOrigins=https://your-netlify-site.netlify.app
```

If you want both Vercel and Netlify to work, use:

```text
AllowedOrigins=https://kaahlibrary.vercel.app,https://your-netlify-site.netlify.app
```

Then redeploy Railway.
