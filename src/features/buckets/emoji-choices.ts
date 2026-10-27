/** Emoji offered when picking a bucket's icon. Any other emoji can be typed in. */
export const EMOJI_CHOICES = [
  "🍜",
  "🍔",
  "☕",
  "🍱",
  "🛒",
  "🍷",
  "🚇",
  "🚗",
  "⛽",
  "🚕",
  "✈️",
  "🏖️",
  "🏠",
  "💡",
  "📱",
  "🧾",
  "🔧",
  "🧹",
  "🎉",
  "🎬",
  "🎮",
  "🎵",
  "📚",
  "🎓",
  "💊",
  "🏋️",
  "👕",
  "💄",
  "🎁",
  "🐶",
  "📈",
  "🏦",
  "💰",
  "🛟",
  "💳",
  "❤️",
] as const;

/** The first emoji (or character) someone typed, e.g. from the iOS emoji keyboard. */
export function firstGrapheme(text: string): string {
  const trimmed = text.trim();
  if (trimmed === "") return "";
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = segmenter.segment(trimmed)[Symbol.iterator]().next();
  return first.done ? "" : first.value.segment;
}
