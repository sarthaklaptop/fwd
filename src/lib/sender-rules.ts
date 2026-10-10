// From-address rules shared by the server check (sender.ts) and the campaign
// form, so the form rejects exactly what the server would.

export const MAX_DISPLAY_NAME_LENGTH = 100;

// Unquoted RFC 5322 dot-atom local part.
// Quoted local parts are rejected on purpose.
export const LOCAL_PART_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

// Characters that carry meaning in an address header. A display name holding
// any of them could make SES parse a different mailbox than the one we checked.
export const UNSAFE_DISPLAY_NAME_RE = /[<>()"\\@,;:[\]\x00-\x1f\x7f]/;

export const ENCODED_WORD_RE = /^=\?UTF-8\?B\?([A-Za-z0-9+/]+={0,2})\?=$/i;

/**
 * Turn a stored display name back into plain text for editing:
 * `"Name"` becomes Name, and a UTF-8 base64 encoded-word becomes its text.
 * Anything else is returned trimmed.
 */
export function plainDisplayName(raw: string): string {
  const name = raw.trim();

  const quoted = name.match(/^"([^"\\]*)"$/);
  if (quoted) return quoted[1].trim();

  const encoded = name.match(ENCODED_WORD_RE);
  if (encoded) {
    try {
      const bytes = Uint8Array.from(atob(encoded[1]), (c) =>
        c.charCodeAt(0),
      );
      return new TextDecoder().decode(bytes).trim();
    } catch {
      return name;
    }
  }

  return name;
}

/**
 * Check a plain display name and the part before the @ the same way
 * resolveSender will. Returns a message for the user, or null if both pass.
 */
export function checkFromParts(
  name: string,
  localPart: string,
): string | null {
  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    return `From name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer`;
  }

  const unsafe = new Set(
    (name.match(new RegExp(UNSAFE_DISPLAY_NAME_RE, 'g')) ?? []).map((c) =>
      /[\x00-\x1f\x7f]/.test(c) ? 'tabs or line breaks' : c,
    ),
  );
  if (name.includes('=?')) unsafe.add('=?');
  if (unsafe.size > 0) {
    return `From name can't contain ${[...unsafe].join(' ')}`;
  }

  if (localPart.length > 64 || !LOCAL_PART_RE.test(localPart)) {
    return "From email can't start or end with a dot, or have two dots in a row";
  }

  return null;
}
