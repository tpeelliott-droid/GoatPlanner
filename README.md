# Goat Track Planner

An installable phone app (PWA) that centralises The Goat Track's content planning: one shared
calendar for recordings, publish dates and events; one idea bank across podcast, video, article
and Instagram; a lightweight partner CRM; and a personal task list. Built from the [v1 PRD](.).

Stack: **React 19 + TypeScript + Vite**, **Firebase** (Auth, Firestore, Storage, Cloud Messaging,
Cloud Functions), Tailwind CSS v4, `vite-plugin-pwa`.

## What's implemented

- **Auth** — Google sign-in or email magic link, invite-only (the very first user to sign in
  bootstraps as Admin; everyone after that needs an invite sent from Settings → Team).
- **Home** — my list, next two recordings, rest of week, up for grabs, in production, needs
  attention, recent activity.
- **Calendar** — month / week / agenda views, all PRD event types, clash warnings, per-event
  reminders, idea linking, and a private read-only iCal feed per user (Settings → Calendar sync).
- **Ideas** — segmented by format, idea page with notes/images/links/voice notes, per-format
  angles, upvotes, status flow, idea ↔ event scheduling.
- **Pipeline** — Kanban board (Approved → Published) per format, checklist templates, sponsor
  deliverables.
- **Network** — organisations, people, interaction log with next-step reminders (auto-creates a
  task), partnership pipeline, want-to-talk-to shortlist, deal notes (Admin-only).
- **My List** — claim/assign/reassign, grouped by due date, snooze, swipe-style complete.
- **Quick Capture** — floating + for a new idea, event, contact or voice note in under 15s.
- **Welcome quote card** — shuffled Gary Player quotes, offline, skipped on notification deep links.
- **PWA** — installable, offline-capable (Firestore persistence + app-shell precache), goat-mark
  icon set, manifest.
- Firestore/Storage security rules, composite indexes, and Cloud Functions for the iCal feed and
  push notifications (assignment pushes, recording reminders, 07:00 daily digest).

**Known simplifications** (fast follow-ups, not full PRD-parity yet):
- Pipeline board stage changes are tap-based (no drag-and-drop between columns yet).
- Home's "pull to refresh" relies on Firestore's always-live realtime subscriptions rather than a
  physical pull gesture.
- Voice-note transcription and the Android Share Target flow are stubbed for v1.1 per the PRD's
  own release plan.
- Guest role, guest prep sheets, newsletter builder and analytics are v2/considered-for-later per
  the PRD and are not built.

## Getting started

### 1. Create a Firebase project

1. In the [Firebase console](https://console.firebase.google.com), create a project.
2. Add a **Web app** and copy the config values into a local `.env` (copy `.env.example`).
3. Enable **Authentication** → Sign-in methods: Google, and Email link (passwordless).
4. Enable **Firestore** (production mode) and **Storage**.
5. (Optional, for push) Enable **Cloud Messaging** and generate a **Web Push certificate**
   (Project settings → Cloud Messaging → Web configuration) — put the key pair in
   `VITE_FIREBASE_VAPID_KEY`.

### 2. Install and run the app

```bash
npm install
cp .env.example .env   # fill in your Firebase config
npm run dev
```

The first person to sign in (Google or magic link) automatically becomes the team's Admin —
no invite needed for that one. Everyone after that needs an invite from Settings → Team.

### 3. Deploy Firestore/Storage rules and indexes

```bash
npm install -g firebase-tools   # if you don't have it
firebase login
firebase use --add              # pick your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 4. Deploy Cloud Functions (iCal feed + push notifications)

```bash
cd functions
npm install
npm run deploy
```

This deploys `icalFeed` (the read-only calendar export), `onTaskAssigned` (push on assignment),
`eventReminders` (runs every 15 minutes, pushes recording/event reminders at their configured
offsets), and `morningDigest` (daily 07:00 SAST push of what's due today). Set
`VITE_FUNCTIONS_BASE_URL` in `.env` if your functions aren't in `us-central1` (the app otherwise
derives `https://us-central1-<project-id>.cloudfunctions.net`).

### 5. Build and deploy the app (Firebase Hosting, or any static host)

```bash
npm run build
firebase deploy --only hosting
```

`dist/` is a static site — any static host works if you'd rather not use Firebase Hosting, as
long as it rewrites unknown paths to `index.html` (see `firebase.json` → `hosting.rewrites`).

### Local Firebase emulators (optional)

```bash
firebase emulators:start
# then run the app with:
VITE_USE_FIREBASE_EMULATORS=true npm run dev
```

## Project structure

```
src/
  firebase/       Firebase app/auth/firestore/storage/messaging config, typed collections
  types/          Shared TypeScript types matching the Firestore data model
  hooks/          Realtime Firestore hooks + CRUD/mutation functions per collection
  store/          Zustand auth store
  utils/          Dates, formatting, image compression, quotes, welcome-screen logic
  components/
    auth/         Sign-in, invite gate, AuthProvider
    layout/       App shell, bottom tab bar, header
    welcome/      Gary Player welcome quote card
    home/         Home dashboard
    calendar/     Month/week/agenda views, event form/detail, idea linking
    ideas/        Ideas list + idea detail page (notes, images, links, format angles, activity)
    pipeline/     Production pipeline Kanban board
    network/      Organisations, people, interactions
    mylist/       Personal task list
    quickcapture/ Floating + menu: new idea/event/contact/voice note
    settings/     Profile, notifications, calendar sync, team/invites
    common/       Design-system primitives (chips, pills, cards, buttons, sheets, forms)
functions/        Firebase Cloud Functions (iCal feed, push notifications)
firestore.rules, firestore.indexes.json, storage.rules, firebase.json
```

## Design system

Brand palette, typography and component rules live in `src/index.css` (Tailwind v4 `@theme`
tokens) — dark green `#164A42` chrome, fairway green `#285E53` surfaces, gold `#FFC531` as a
single accent per screen, parchment `#F4EFE4` for light-mode/paper texture, rust `#C8622F` for
warnings/overdue. Format colours (Podcast/Video/Article/Instagram) are defined in
`src/utils/format.ts` and surfaced consistently via `FormatChip` everywhere content shows up.
