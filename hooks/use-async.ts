"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

/** Generic fetch hook. Takes a zero-arg async function and tracks status. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);

  const run = useCallback(async () => {
    const call = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (call === latest.current) setData(result);
    } catch (err) {
      if (call === latest.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (call === latest.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, error, loading, refetch: run };
}
