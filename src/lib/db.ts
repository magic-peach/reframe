import { EditRecipe } from "@/lib/types";

export interface RecoverySession {
  id: string;
  file: File | null;
  musicFile: File | null;
  overlayFile: File | null;
  recipe: EditRecipe;
  duration: number;
  videoMetadata: { width: number; height: number; duration: number } | null;
  lastSavedAt: number;
}

const DB_NAME = "ReframeDB";
const STORE_NAME = "sessions";
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveSession(session: Omit<RecoverySession, "id">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ ...session, id: "current-session" });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadSession(): Promise<RecoverySession | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get("current-session");
      
      request.onsuccess = () => {
        const result = request.result as RecoverySession | undefined;
        if (!result) return resolve(null);
        
        // Check if it's older than 24 hours
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        if (Date.now() - result.lastSavedAt > TWENTY_FOUR_HOURS) {
          clearSession().catch(console.error);
          return resolve(null);
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to load session from IndexedDB:", err);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete("current-session");
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Failed to clear session from IndexedDB:", err);
  }
}
