# Setup steps that need your accounts

Everything here is free. Each step says what it unlocks.

## 1. Family server (Supabase): login and Family Table

1. Sign up at supabase.com and create a project. Pick the Mumbai region. Save the database password somewhere safe.
2. Go to Project Settings > API. Copy the Project URL and the `anon` public key.
3. In the project folder, copy `.env.example` to `.env` and paste both values. Never commit `.env`.
4. Open SQL Editor > New query, paste all of `supabase/schema.sql`, press Run.
5. Authentication > Providers > Email: keep it on.
6. Authentication > Email Templates > Magic Link: replace the body with:
   `Your Mummy Said So code is {{ .Token }}`
   The app asks for this 6-digit code.
7. Authentication > URL Configuration > Redirect URLs: add `mummysaidso://auth` and `http://localhost:8081`.
8. Restart the app server. The login buttons turn on.

The free plan sends only a few emails per hour. That's fine for one family. If many families join, connect a free email service later.

### Google sign-in (optional, after step 1)

1. Go to console.cloud.google.com, create a project, open APIs & Services > Credentials.
2. Create an OAuth client ID of type Web application.
3. Add this Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
4. Paste the client ID and secret into Supabase > Authentication > Providers > Google and turn it on.

## 2. Exact YouTube videos (optional)

The Watch video button currently opens a YouTube search limited to trusted channels. To link one fixed video per dish:

1. In the same Google Cloud project, enable YouTube Data API v3.
2. Create an API key and send it to me. I'll run a one-time script that picks a real video per dish and saves the video IDs in the app. The key itself never goes in the app.

## 3. Install the app on Android phones (APK)

1. Create a free account at expo.dev.
2. In the project folder run:

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest build -p android --profile preview
```

3. The build runs in Expo's cloud (free tier) and gives you a download link for the APK.
4. Send the link or the file on WhatsApp. On each phone, allow "Install unknown apps" for WhatsApp or the browser when Android asks.

## 4. Put the landing page online

1. Create a free account at vercel.com.
2. In the `site` folder run:

```bash
npx vercel
```

3. You get a free `*.vercel.app` address to share. Put the APK link on the page's download button when it exists.
