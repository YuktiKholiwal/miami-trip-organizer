// Destructive actions in the app require the user to type the word
// "science" to confirm. This is intentionally a typed phrase rather
// than a one-click confirm so accidental taps on mobile can't blow
// away data shared with the whole crew.
const CODE_WORD = "science";

export function confirmDelete(label = "this") {
  const input = window.prompt(
    `Type "${CODE_WORD}" to delete ${label}.\n\nThis can't be undone.`
  );
  if (input == null) return false;
  return input.trim().toLowerCase() === CODE_WORD;
}
