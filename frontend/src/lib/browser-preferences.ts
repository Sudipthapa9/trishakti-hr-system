// Invalid, absent or blocked presentation cookies fall back to the configured value.
export function readBooleanCookie(
  name: string,
  fallback: boolean,
  cookies?: string,
): boolean {
  try {
    const source =
      cookies ?? (typeof document === "undefined" ? "" : document.cookie);
    const value = source
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(name + "="))
      ?.slice(name.length + 1);
    return value === "true" ? true : value === "false" ? false : fallback;
  } catch {
    return fallback;
  }
}
