// Ships in the app bundle so the welcome screen works offline.
export const GARY_PLAYER_QUOTES = [
  "The harder I practice, the luckier I get.",
  "You must work very hard to become a natural golfer.",
  "We create success or failure on the course primarily by our thoughts.",
  "Golf is a puzzle without an answer.",
  "Golf asks something of a man. It makes one loathe mediocrity.",
  "If there's a golf course in heaven, I hope it's like Augusta National.",
];

const ORDER_KEY = "goatplanner.quoteOrder";
const POSITION_KEY = "goatplanner.quotePosition";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Returns the next quote in a shuffled cycle, persisting position on the device. */
export function nextQuote(): string {
  let order: number[];
  try {
    order = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "null");
  } catch {
    order = null as unknown as number[];
  }
  if (!Array.isArray(order) || order.length !== GARY_PLAYER_QUOTES.length) {
    order = shuffle(GARY_PLAYER_QUOTES.map((_, i) => i));
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    localStorage.setItem(POSITION_KEY, "0");
  }

  let position = parseInt(localStorage.getItem(POSITION_KEY) ?? "0", 10);
  if (Number.isNaN(position) || position >= order.length) position = 0;

  const quote = GARY_PLAYER_QUOTES[order[position]];

  const nextPosition = position + 1;
  if (nextPosition >= order.length) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(shuffle(GARY_PLAYER_QUOTES.map((_, i) => i))));
    localStorage.setItem(POSITION_KEY, "0");
  } else {
    localStorage.setItem(POSITION_KEY, String(nextPosition));
  }

  return quote;
}
