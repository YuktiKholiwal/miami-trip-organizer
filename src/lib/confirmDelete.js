// Destructive actions are gated behind a secret key that only the trip
// owner knows, so the crew (everyone shares the same live data) can't
// delete things — by accident or otherwise. The prompt deliberately
// does NOT reveal the key.
//
// Note: this is a casual safeguard, not real security. The key ships in
// the client bundle, so anyone who digs through the JS can find it. It's
// here to stop friends tapping delete, not a determined attacker.
const SECRET_KEY = "science";

export function confirmDelete(label = "this") {
  const input = window.prompt(
    `Enter the secret key to delete ${label}.\n\n(If you don't know it, ask the trip captain — this can't be undone.)`
  );
  if (input == null) return false;
  const ok = input.trim().toLowerCase() === SECRET_KEY;
  if (!ok) {
    window.alert("Wrong key — nothing was deleted.");
  }
  return ok;
}
