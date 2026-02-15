import { useState, useEffect, useCallback } from 'react';
import apiService, { Requirement, GlobalStatus } from '../services/api';

interface UseRealtimeUpdatesOptions {
  interval?: number; // Polling interval in milliseconds
  enabled?: boolean;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const { interval = 5000, enabled = true } = options;
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [globalStatus, setGlobalStatus] = useState<GlobalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [reqs, status] = await Promise.all([
        apiService.getRequirements(),
        apiService.getGlobalStatus(),
      ]);
      setRequirements(reqs);
      setGlobalStatus(status);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for updates
  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [enabled, interval, fetchData]);

  return {
    requirements,
    globalStatus,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}
