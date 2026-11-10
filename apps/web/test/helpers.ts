/** Installs a Map-backed window.localStorage; pass `broken` to make every call throw like private mode. */
export function installLocalStorage({ broken = false } = {}) {
  const store = new Map<string, string>();
  const guard = () => {
    if (broken) throw new Error("SecurityError");
  };
  const localStorage = {
    getItem: (key: string) => (guard(), store.get(key) ?? null),
    setItem: (key: string, value: string) => (guard(), void store.set(key, String(value))),
    removeItem: (key: string) => (guard(), void store.delete(key)),
  };
  (globalThis as { window?: unknown }).window = { localStorage };
  return store;
}

export function removeWindow() {
  delete (globalThis as { window?: unknown }).window;
}
