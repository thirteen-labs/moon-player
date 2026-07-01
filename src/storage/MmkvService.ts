import { createMMKV } from 'react-native-mmkv';

export const mmkvStorage = createMMKV({
  id: 'aura-storage',
});

export const MmkvService = {
  getString(key: string): string | undefined {
    return mmkvStorage.getString(key);
  },

  setString(key: string, value: string): void {
    mmkvStorage.set(key, value);
  },

  getBoolean(key: string): boolean {
    return mmkvStorage.getBoolean(key) ?? false;
  },

  setBoolean(key: string, value: boolean): void {
    mmkvStorage.set(key, value);
  },

  getNumber(key: string): number {
    return mmkvStorage.getNumber(key) ?? 0;
  },

  setNumber(key: string, value: number): void {
    mmkvStorage.set(key, value);
  },

  getObject<T>(key: string): T | undefined {
    const json = mmkvStorage.getString(key);
    if (!json) return undefined;
    try {
      return JSON.parse(json) as T;
    } catch {
      return undefined;
    }
  },

  setObject<T>(key: string, value: T): void {
    mmkvStorage.set(key, JSON.stringify(value));
  },

  remove(key: string): void {
    mmkvStorage.remove(key);
  },

  clearAll(): void {
    mmkvStorage.clearAll();
  },

  contains(key: string): boolean {
    return mmkvStorage.contains(key);
  },

  getAllKeys(): string[] {
    return mmkvStorage.getAllKeys();
  },
};
