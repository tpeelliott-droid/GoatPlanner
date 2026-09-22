const SESSION_KEY = "goatplanner.welcomeShown";

/** Shows once per app session (cold open), and never when the app was opened via a push notification deep link. */
export function shouldShowWelcome(): boolean {
  if (window.sessionStorage.getItem(SESSION_KEY)) return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has("notif")) return false;
  return true;
}

export function markWelcomeShown() {
  window.sessionStorage.setItem(SESSION_KEY, "1");
}
