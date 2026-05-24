# Supabase sync setup (10 min)

The app already works fully on localStorage. Adding Supabase makes every device see the same data in real time.

## 1. Create a free project
- Go to <https://supabase.com> → **New project**.
- Pick any name (e.g. `miami-trip`), set a strong DB password, choose a region close to your friends.
- Wait ~1 min for it to provision.

## 2. Run the schema
- In your project: **SQL Editor → New query**.
- Open `supabase/schema.sql` from this repo, paste the contents, and run it.
- You should see a `trips` table created in **Table editor**.

## 3. Grab your keys
- Go to **Project Settings → API**.
- Copy the **Project URL** and the **anon public** key.

## 4. Add them locally
```bash
cp .env.example .env.local
# then edit .env.local and paste the values
```

Restart `npm run dev`. The badge in the top right should flip from `connecting…` to `synced` ✅

## 5. Share with the crew
- Deploy the site (Vercel/Netlify — both have a free tier; point them at this repo).
- Set the same three env vars in the host's project settings.
- Send everyone the URL. They share one synced copy of the data.

## Notes
- Policies are intentionally permissive (anyone with the URL can read + edit). That's fine for a private group of friends — just don't share the URL publicly.
- If you ever want to "start over" without losing local data, change `VITE_TRIP_ID` to a new string.
- Realtime takes <1s usually. If a device is offline, edits queue locally and push when reconnected.
