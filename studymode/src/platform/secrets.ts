/**
 * Secure storage for optional API keys. Native builds use the OS credential
 * store through Rust; the webview can save/delete/check but never read a key.
 * The browser build has no secure store, so AI features are unavailable there.
 */
import { invoke } from "@tauri-apps/api/core";
import { isNative } from "./env";

export type SecretName = "anthropic_api_key";

export const secrets = {
  async available(): Promise<boolean> {
    if (!isNative()) return false;
    try {
      return await invoke<boolean>("secret_store_available");
    } catch {
      return false;
    }
  },
  async exists(name: SecretName): Promise<boolean> {
    if (!isNative()) return false;
    try {
      return await invoke<boolean>("secret_exists", { name });
    } catch {
      return false;
    }
  },
  async set(name: SecretName, value: string): Promise<void> {
    if (!isNative()) throw new Error("Secure key storage is only available in the desktop app.");
    await invoke("secret_set", { name, value });
  },
  async remove(name: SecretName): Promise<void> {
    if (!isNative()) return;
    await invoke("secret_delete", { name });
  },
};
