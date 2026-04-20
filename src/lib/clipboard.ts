/**
 * Best-effort clipboard copy with fallbacks for Safari/iOS and restricted contexts.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const value = String(text ?? '');
  if (!value) return false;

  // Clipboard API only works in secure contexts in most browsers.
  const canUseClipboardApi = typeof navigator !== 'undefined' && !!navigator.clipboard && window.isSecureContext;
  if (canUseClipboardApi) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // fall through
    }
  }

  // Legacy fallback (works in many cases where Clipboard API is blocked).
  try {
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', 'true');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.opacity = '0';
    document.body.appendChild(el);

    // iOS Safari needs a real selection range.
    el.focus();
    el.select();
    el.setSelectionRange(0, value.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    if (ok) return true;
  } catch {
    // ignore
  }

  // Last resort: user copies manually.
  try {
    window.prompt('Copiez le texte ci-dessous (Cmd/Ctrl + C) :', value);
    return true;
  } catch {
    return false;
  }
}
