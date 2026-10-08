import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useApp } from "./store";
import type { Repo } from "../data/repo";

/** Subscribe to repository changes. */
function useRepoVersion(repo: Repo) {
  return useSyncExternalStore(
    (cb) => repo.subscribe(cb),
    () => repo.version,
  );
}

export interface Live<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/** Load data from the repository and reload whenever it changes. */
export function useLive<T>(fn: (repo: Repo) => Promise<T>, deps: unknown[]): Live<T> {
  const repo = useApp((s) => s.services!.repo);
  const version = useRepoVersion(repo);
  const [state, setState] = useState<{ data: T | undefined; loading: boolean; error: Error | null }>({ data: undefined, loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fnRef.current(repo).then(
      (data) => !cancelled && setState({ data, loading: false, error: null }),
      (error: Error) => !cancelled && setState((s) => ({ data: s.data, loading: false, error })),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, version, nonce, ...deps]);
  return { ...state, reload: () => setNonce((n) => n + 1) };
}

export function useServices() {
  return useApp((s) => s.services!);
}

export function useCert() {
  const certId = useApp((s) => s.prefs.currentCertId);
  return useLive((r) => (certId ? r.getCertification(certId) : Promise.resolve(null)), [certId]);
}

/** Re-render periodically (for clocks). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Run an async action with busy state and error toasts. */
export function useAction() {
  const toast = useApp((s) => s.toast);
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
    setBusy(true);
    try {
      const r = await fn();
      if (success) toast(success, "success");
      return r;
    } catch (e) {
      toast((e as Error).message || "Something went wrong.", "error");
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}
