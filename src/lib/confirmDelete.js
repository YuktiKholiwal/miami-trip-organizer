// Destructive actions are gated behind a secret key that only the trip
// owner knows, so the crew (everyone shares the same live data) can't
// delete things — by accident or otherwise. The prompt deliberately
// does NOT reveal the key.
//
// Note: this is a casual safeguard, not real security. The key ships in
// the client bundle, so anyone who digs through the JS can find it. It's
// here to stop friends tapping delete, not a determined attacker.
const SECRET_KEY = "science";

// Once the correct key is entered, the device stays unlocked for the rest
// of the session (until a full reload/close). Kept in memory only — never
// persisted — so it can't leak via storage and resets when the app closes.
let unlocked = false;

function askForKey(promptText, wrongText) {
  if (unlocked) return true;
  const input = window.prompt(promptText);
  if (input == null) return false;
  if (input.trim().toLowerCase() === SECRET_KEY) {
    unlocked = true;
    return true;
  }
  window.alert(wrongText);
  return false;
}

export function confirmDelete(label = "this") {
  return askForKey(
    `Enter the secret key to delete ${label}.\n\n(If you don't know it, ask the trip captain — this can't be undone.)`,
    "Wrong key — nothing was deleted."
  );
}

// Gate a non-delete action (e.g. adding an expense) behind the same key.
export function confirmSecret(action = "continue") {
  return askForKey(
    `Enter the secret key to ${action}.\n\n(If you don't know it, ask the trip captain.)`,
    "Wrong key — cancelled."
  );
}
