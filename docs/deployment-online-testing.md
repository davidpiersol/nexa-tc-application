# Online deployment (Vercel, Netlify) & MCP

Use this when you want a **hosted URL** for QA beyond `localhost`.

For **production vs local env vars**, **Netlify env setup**, **demo seeding**, and a **pre-flight checklist**, see **[`production-deploy.md`](production-deploy.md)**.

## MCP: Vercel / Netlify in Cursor?

**This repository does not configure a Vercel or Netlify MCP server.** The Cursor MCP workspace for this project is focused on other integrations (e.g. design tooling)—not deployment platforms.

To deploy from Cursor you typically:

- Use the **host’s CLI** (`vercel`, `netlify`) in the terminal, or  
- Use each platform’s **dashboard** (Git connect + env vars), or  
- Install a **community MCP** for Vercel/Netlify in Cursor settings yourself if one exists and you trust it.

Nothing in `package.json` or this repo automatically wires Netlify/Vercel MCP.

## Vercel (common choice for Next.js)

1. Push the repo to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com) → framework preset **Next.js**.
3. **Environment variables:** copy every production-needed key from [`.env.example`](../.env.example) into Vercel **Project → Settings → Environment Variables** (Production / Preview as needed).
4. **Build:** default `npm run build` runs `help:build` via `prebuild`—no extra step.
5. **Supabase Auth:** in Supabase **Authentication → URL configuration**, add your Vercel URL(s), e.g. `https://your-app.vercel.app` and `https://your-app.vercel.app/**` under Redirect URLs.

## Netlify

Next.js 14 works with Netlify using their Next runtime/plugin (see [Netlify Next.js docs](https://docs.netlify.com/frameworks/next-js/overview/)).

1. Connect the repo in Netlify.
2. Set the same env vars as Vercel (from `.env.example`).
3. Add the Netlify URL to Supabase Auth redirect URLs.

## Serverless limits

- **Inngest:** configure `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` for the deployed `/api/inngest` route.
- **Long-running / Node-only routes:** ensure platform supports Node for webhooks (`nodejs` runtime where specified).
- **Upstash:** required for API/login rate limits as implemented; without Redis keys, some limits may no-op (see code paths).

## Checklist before sharing a preview URL

- [ ] All secrets in host dashboard, not committed  
- [ ] Supabase migrations applied to the **same** project your env points at  
- [ ] Supabase Auth redirect URLs include the deployment domain  
- [ ] HTTPS (hosts provide this by default)
