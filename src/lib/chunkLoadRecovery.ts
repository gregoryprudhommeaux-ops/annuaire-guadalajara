const RELOAD_FLAG_KEY = 'did_reload_after_chunk_error_v1';

export function isChunkLoadError(reason: unknown): boolean {
  const msg = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason ?? '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError')
  );
}

/** After deploy, stale tabs may reference removed JS chunks — reload once, then cache-bust. */
export function maybeReloadOnChunkError(reason: unknown): boolean {
  if (!isChunkLoadError(reason)) return false;

  try {
    const did = sessionStorage.getItem(RELOAD_FLAG_KEY) === '1';
    if (!did) {
      sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
      window.location.reload();
      return true;
    }
  } catch {
    if (!(window as any).__didReloadAfterChunkErrorV1) {
      (window as any).__didReloadAfterChunkErrorV1 = true;
      window.location.reload();
      return true;
    }
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('__reload', String(Date.now()));
    window.location.replace(url.toString());
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
  } catch {
    /* ignore */
  }
}
