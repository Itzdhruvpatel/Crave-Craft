import Storage from 'expo-sqlite/kv-store';

export function load(key: string): string | null {
  return Storage.getItemSync(key);
}

export function save(key: string, value: string): void {
  Storage.setItemSync(key, value);
}
