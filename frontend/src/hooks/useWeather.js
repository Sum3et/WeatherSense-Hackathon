/**
 * useWeather — Weather data fetching hook with caching.
 */
import { useState, useEffect, useCallback } from 'react';
import { weatherApi } from '../services/api';

const _cache = new Map();

export function useCurrentWeather(lat, lon, city = '', state = '') {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeather = useCallback(async () => {
    if (!lat || !lon) return;

    const key = `current_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.time < 600_000) {
      setWeather(cached.data);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await weatherApi.getCurrent(lat, lon, city, state);
      setWeather(resp.data);
      _cache.set(key, { data: resp.data, time: Date.now() });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, city, state]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  return { weather, loading, error, refetch: fetchWeather };
}

export function useCitiesWeather() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const key = 'all_cities';
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.time < 600_000) {
      setCities(cached.data);
      setLoading(false);
      return;
    }

    weatherApi.getCities()
      .then(resp => {
        const data = resp.cities || [];
        setCities(data);
        _cache.set(key, { data, time: Date.now() });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { cities, loading, error };
}

export function useForecast(lat, lon, city = '', days = 7) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;
    setLoading(true);
    weatherApi.getForecast(lat, lon, city, days)
      .then(resp => setForecast(resp.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [lat, lon, days]);

  return { forecast, loading, error };
}
