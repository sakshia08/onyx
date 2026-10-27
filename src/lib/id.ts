/** A new random id (PRD §11: crypto.randomUUID()). */
export function newId(): string {
  return crypto.randomUUID();
}
