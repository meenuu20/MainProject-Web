// src/config/adminKeys.js
// Lowercase keys for easy lookup.
// Change values to whatever codes you want to use.

export const ADMIN_KEYS = {
  "alice@authority.org": "ALICE-2025-KEY",
  "bob@authority.org":   "BOB-2025-KEY",
  "carol@authority.org": "CAROL-2025-KEY"
};

// Optional helper to check case-insensitively
export function getKeyForEmail(email) {
  if (!email) return null;
  return ADMIN_KEYS[email.toLowerCase()] || null;
}
