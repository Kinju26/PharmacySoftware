/** Client-safe auth constants (no secrets / server-only helpers). */

export const GENERIC_AUTH_ERROR = "Invalid credentials or account temporarily locked";

/** Idle timeout before forced logout (ms). */
export const SESSION_IDLE_MS = 15 * 60 * 1000;

/** Show warning this long before idle logout (ms). */
export const SESSION_WARN_MS = 60 * 1000;

/** Minimum password length. */
export const PASSWORD_MIN_LENGTH = 12;
