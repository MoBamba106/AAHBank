"use client";

import * as React from "react";

/**
 * Tiny fetch layer with a keyed cache + mutation events (SWR-style but
 * dependency-free). Pages subscribe with useApi and any write (apiPost,
 * apiDelete, …) or mutateKey() refreshes every consumer of that key.
 */

const cache = new Map<string, unknown>();
const subscribers = new Map<string, Set<() => void>>();
const inflight = new Map<string, Promise<unknown>>();

function subscribe(key: string, cb: () => void) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(cb);
  return () => {
    subscribers.get(key)?.delete(cb);
  };
}

export function mutateKey(key: string) {
  cache.delete(key);
  subscribers.get(key)?.forEach((cb) => cb());
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof body.error === "string" ? body.error : `Request failed (${res.status})`);
  }
  return body as T;
}

export const apiGet = <T,>(path: string) => request<T>(path);
export const apiPost = <T,>(path: string, data: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(data) });
export const apiPatch = <T,>(path: string, data: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(data) });
export const apiDelete = <T,>(path: string) => request<T>(path, { method: "DELETE" });

export function useApi<T>(path: string | null, key: string): { data: T | null; loading: boolean; error: string | null; reload: () => void } {
  const [tick, setTick] = React.useState(0);
  const [state, setState] = React.useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: (cache.get(key) as T | undefined) ?? null,
    loading: Boolean(path),
    error: null,
  });

  React.useEffect(() => subscribe(key, () => setTick((t) => t + 1)), [key]);

  React.useEffect(() => {
    if (!path) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let active = true;
    const cached = cache.get(key);
    if (cached !== undefined) {
      setState({ data: cached as T, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const p = (inflight.get(key) ?? apiGet<T>(path)) as Promise<T>;
    inflight.set(key, p as Promise<unknown>);
    p.then(
      (data) => {
        if (!active) return;
        cache.set(key, data);
        setState({ data, loading: false, error: null });
      },
      (err: Error) => {
        if (!active) return;
        setState({ data: null, loading: false, error: err.message });
      },
    ).finally(() => inflight.delete(key));
    return () => {
      active = false;
    };
  }, [path, key, tick]);

  return { ...state, reload: () => mutateKey(key) };
}
