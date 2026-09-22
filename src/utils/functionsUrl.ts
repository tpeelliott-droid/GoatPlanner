export function icalFeedUrl(token: string): string {
  const base =
    import.meta.env.VITE_FUNCTIONS_BASE_URL ||
    `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;
  return `${base}/icalFeed?token=${token}`;
}
