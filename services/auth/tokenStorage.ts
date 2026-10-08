import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token Sanctum HANYA disimpan di SecureStore (Keychain / Keystore). Salinan di memori
 * dipakai klien HTTP supaya tidak membaca SecureStore di setiap permintaan.
 * Web (pratinjau desain saja) tidak punya SecureStore, jadi token hanya di memori.
 */
const TOKEN_KEY = 'sion.auth.token';

let memoryToken: string | null = null;

export function getToken(): string | null {
  return memoryToken;
}

export async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') return memoryToken;
  memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return memoryToken;
}

export async function saveToken(token: string): Promise<void> {
  memoryToken = token;
  if (Platform.OS === 'web') return;
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
}

export async function clearToken(): Promise<void> {
  memoryToken = null;
  if (Platform.OS === 'web') return;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
