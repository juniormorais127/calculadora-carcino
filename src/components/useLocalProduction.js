import { useCallback, useEffect, useRef, useState } from 'react';
import { readLocalProduction, withLocalDeadline } from '../services/localProduction.js';

const empty = { viveiros: [], biometrias: [], qualidadeAgua: [], farmProfile: null };
export default function useLocalProduction(database, dataVersion, onReady) {
  const [snapshot, setSnapshot] = useState(empty);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [hasData, setHasData] = useState(false);
  const state = useRef({ generation: 0, mounted: true, hasData: false });
  const ready = useRef(onReady); ready.current = onReady;
  const loadData = useCallback(async () => {
    const generation = ++state.current.generation;
    const current = () => state.current.mounted && generation === state.current.generation;
    setError(''); setLoading(true);
    // Keep observing a slow read after the warning: a late result recovers the UI.
    const operation = readLocalProduction(database).then(value => {
      if (!current()) return;
      state.current.hasData = true;
      setSnapshot(value); setHasData(true); setError(''); setLoading(false);
      ready.current?.();
    });
    try { await withLocalDeadline(operation); }
    catch (err) {
      if (current()) setError(err.code === 'local/timeout' ? err.message : 'Não foi possível abrir o armazenamento deste aparelho. Feche outras abas do site e tente novamente. Não limpe os dados do navegador.');
    } finally { if (current()) setLoading(false); }
  }, [database]);
  useEffect(() => {
    state.current.mounted = true;
    void loadData();
    return () => { state.current.mounted = false; state.current.generation++; };
  }, [loadData, dataVersion]);
  const retry = useCallback(() => {
    // Explicit user retry reopens a stuck connection, never deletes the database.
    if (!state.current.hasData) database.close();
    return loadData();
  }, [database, loadData]);
  return { ...snapshot, loading, error, hasData, loadData, retry };
}
