export function getGeminiApiKey(): string | undefined {
  return (
    import.meta.env.VITE_GEMINI_API_KEY ||
    (import.meta.env as Record<string, string | undefined>).GEMINI_API_KEY ||
    ((globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env
      ?.GEMINI_API_KEY as string | undefined)
  );
}
