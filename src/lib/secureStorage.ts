import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Native: session lives in the Keychain/Keystore via expo-secure-store. Its ~2KB value limit is
// handled by splitting values into chunks (key.0, key.1, ...) with a count stored at `key`.
// Web: SecureStore is unavailable, so fall back to AsyncStorage (localStorage).
const CHUNK = 1800;
const ENTRY = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_'); // SecureStore key charset

async function readNative(key: string): Promise<string | null> {
  const k = ENTRY(key);
  const head = await SecureStore.getItemAsync(k);
  if (head === null) {
    // one-time migration of a session written by the old unencrypted AsyncStorage adapter
    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) {
      await writeNative(key, legacy);
      await AsyncStorage.removeItem(key);
    }
    return legacy;
  }
  const n = Number(head);
  if (!Number.isInteger(n) || n < 0) return null;
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = await SecureStore.getItemAsync(`${k}.${i}`);
    if (p === null) return null; // torn write: treat as signed out
    parts.push(p);
  }
  return parts.join('');
}

async function removeNative(key: string) {
  const k = ENTRY(key);
  const n = Number(await SecureStore.getItemAsync(k));
  for (let i = 0; i < (Number.isInteger(n) ? n : 0); i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
  await SecureStore.deleteItemAsync(k);
}

async function writeNative(key: string, value: string) {
  const k = ENTRY(key);
  await removeNative(key);
  const n = Math.ceil(value.length / CHUNK);
  for (let i = 0; i < n; i++) await SecureStore.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
  await SecureStore.setItemAsync(k, String(n)); // written last so a torn write reads as empty
}

export const secureStorage = Platform.OS === 'web'
  ? AsyncStorage
  : {
      getItem: readNative,
      setItem: writeNative,
      removeItem: async (key: string) => { await removeNative(key); await AsyncStorage.removeItem(key); },
    };
