# Pomoodle

A simple cross-platform Pomodoro app built with Expo and Supabase.

## Features

- Email/password authentication
- Google authentication
- Create, start, pause, and cancel Pomodoro sessions
- Automatic completion tracking for 25-minute sessions
- Stats bar chart by day/week/month/year

## Tech Stack

- Expo + React Native + Expo Router
- Supabase Auth + Postgres + Row Level Security

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. In Supabase SQL Editor, run `supabase/schema.sql`.

4. In Supabase Auth settings:

- Enable Email provider
- Enable Google provider and set credentials
- Add redirect URL that matches your app scheme (`pomoodle://login`)

5. Start the app:

```bash
npx expo start
```

## Notes

- Default session length in v1 is fixed at 25 minutes.
- Stats count only completed sessions.
- Session rows are user-scoped with RLS policies.

## Legal URLs (Recommended GitHub Pages)

- Privacy Policy: `https://ethphan.github.io/pomoodle/privacy/`
- Terms of Service: `https://ethphan.github.io/pomoodle/terms/`
- Account Deletion: `https://ethphan.github.io/pomoodle/delete-account/`

### Publish docs on GitHub Pages

1. In GitHub repo settings, enable Pages.
2. Set source to `Deploy from a branch`.
3. Choose branch `main` and folder `/docs`.
4. After deploy, verify the three URLs above load successfully.
