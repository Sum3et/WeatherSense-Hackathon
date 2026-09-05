import { useState, useEffect, useCallback } from 'react';
import { listenToReports, listenToVerifiedReports, isConfigured } from '../services/firebase';
import { reportsApi, adminApi } from '../services/api';

export function useReports({ status = 'VERIFIED', limit: limitCount = 50 } = {}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);

    if (isConfigured) {
      const unsubscribe = listenToReports(status, (data) => {
        setReports(data);
        setLoading(false);
        setError(null);
      }, limitCount);
      return unsubscribe;
    } else {
      // Backend API fallback
      reportsApi.getPublic({ limit: limitCount })
        .then((res) => {
          setReports(res?.reports || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [status, limitCount]);

  return { reports, loading, error };
}

export function useVerifiedReports(limitCount = 30) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (isConfigured) {
      const unsub = listenToVerifiedReports((data) => {
        setReports(data);
        setLoading(false);
      }, limitCount);
      return unsub;
    } else {
      reportsApi.getPublic({ limit: limitCount })
        .then((res) => {
          setReports(res?.reports || []);
          setLoading(false);
        })
        .catch(() => {
          setReports([]);
          setLoading(false);
        });
    }
  }, [limitCount]);

  return { reports, loading };
}

export function useAllReports(limitCount = 100) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(() => {
    setLoading(true);
    if (isConfigured) {
      const unsub = listenToReports(null, (data) => {
        setReports(data);
        setLoading(false);
      }, limitCount);
      return unsub;
    } else {
      adminApi.getReports({ limit: limitCount })
        .then((res) => {
          setReports(res?.reports || []);
          setLoading(false);
        })
        .catch(() => {
          setReports([]);
          setLoading(false);
        });
      return () => {};
    }
  }, [limitCount]);

  useEffect(() => {
    const unsub = fetchReports();
    return () => unsub?.();
  }, [fetchReports]);

  // Derived counts
  const counts = {
    total:    reports.length,
    pending:  reports.filter(r => r.status === 'PENDING').length,
    verified: reports.filter(r => r.status === 'VERIFIED').length,
    flagged:  reports.filter(r => r.status === 'FLAGGED').length,
    spam:     reports.filter(r => r.status === 'SPAM').length,
  };

  return { reports, loading, counts, refetch: fetchReports };
}
