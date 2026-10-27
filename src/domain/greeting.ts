/** "Good evening, Sakshi" (PRD §8.3), from the local hour. */
export function greeting(hour: number, name?: string): string {
  const part = hour < 5 ? "evening" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const trimmed = name?.trim() ?? "";
  return trimmed === "" ? `Good ${part}` : `Good ${part}, ${trimmed}`;
}
