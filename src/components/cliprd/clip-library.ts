export type ClipLibraryItem = {
  id: string;
  url: string;
  file: string;
  index: number;
  createdAt: number;
};

const KEY = "cliprd.personal.library.v1";

export function readClipLibrary(): ClipLibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function addClipLibrary(items: Array<{ url: string; file: string; index: number }>) {
  if (typeof window === "undefined") return;
  const current = readClipLibrary();
  const next = [
    ...items.map((item) => ({
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      createdAt: Date.now(),
    })),
    ...current,
  ].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("cliprd-library-updated"));
}

export function clearClipLibrary() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("cliprd-library-updated"));
}
