import { serializeData, normalizeData, isEmptyData, DATA_TABLES } from './cloudData.js';
import { mergeCloudData } from './cloudMerge.js';

// Dependencies are injected so offline/error/conflict paths can be tested without credentials.
export function createCloudSync({ remote, readLocal, replaceLocal, readMeta, saveMeta, onStatus = () => {} }) {
  let stopped = false;
  let running = null;
  let again = false;
  let raceRetries = 0;
  const report = value => { if (!stopped) onStatus(value); };
  const perform = async () => {
    report({ state: 'syncing', message: 'Sincronizando com sua conta…' });
    try {
      const local = normalizeData(await readLocal());
      const signature = serializeData(local);
      const meta = await readMeta();
      const cloud = await remote.read();
      if (stopped) return;
      const dirty = meta ? signature !== meta.baseline : !isEmptyData(local);
      let target = local;
      const serverReset = !cloud.data && (meta?.revision || 0) > 0;
      const diverged = serverReset || (dirty && cloud.data && cloud.revision !== (meta?.revision || 0) && serializeData(cloud.data) !== signature);
      if (serverReset) target = { versao: 1, ...Object.fromEntries(DATA_TABLES.map(table => [table, []])) };
      else if (cloud.data && !dirty) target = normalizeData(cloud.data);
      else if (diverged) {
        let base;
        try { base = normalizeData(JSON.parse(meta?.baseline)); } catch { /* Legacy copies without shared baseline use cloud authority. */ }
        target = base ? mergeCloudData(base, local, cloud.data) : normalizeData(cloud.data);
      }
      // Edits made during the network read belong to the next reconciliation.
      if (serializeData(await readLocal()) !== signature) { again = true; return; }
      const targetSignature = serializeData(target);
      const cloudSignature = serializeData(cloud.data || { versao: 1, ...Object.fromEntries(DATA_TABLES.map(table => [table, []])) });
      const rebased = { revision: cloud.revision, baseline: cloudSignature || signature, ...(diverged ? { recovery: local, recoveryAt: Date.now() } : {}) };
      if (targetSignature !== signature) {
        // Data and shared baseline are committed together by the local adapter.
        await replaceLocal(target, signature, rebased);
      } else if (diverged) await saveMeta(rebased);
      if (stopped) return;
      if (targetSignature !== cloudSignature && (cloud.data || !isEmptyData(target))) {
        const revision = await remote.write(target, cloud.revision);
        if (stopped) return;
        await saveMeta({ revision, baseline: targetSignature, syncedAt: Date.now() });
      } else await saveMeta({ revision: cloud.revision, baseline: targetSignature, syncedAt: Date.now() });
      if (serializeData(await readLocal()) !== (await readMeta())?.baseline) { again = true; return; }
      report({ state: 'synced', message: 'Dados atualizados na nuvem. Cópia offline disponível neste aparelho.' });
    } catch (error) {
      if (error.code === 'sync/conflict') {
        again = raceRetries++ < 2;
        report({ state: 'pending', message: 'Outro aparelho atualizou a conta. Reconciliando automaticamente com a nuvem; os registros deste aparelho estão preservados.' });
      } else {
        const messages = {
          'permission-denied': 'O Firebase não autorizou a sincronização desta sessão. Sua cópia local está preservada. Tente sincronizar novamente ou entre de novo na conta.',
          'auth/email-not-verified': 'Confirme seu e-mail para sincronizar. Sua cópia local está preservada.',
          'auth/session-changed': 'A conta mudou durante a sincronização. Entre novamente na conta correta. Sua cópia local está preservada.',
        };
        report({ state: 'pending', errorCode: error.code || 'sync/unknown', message: messages[error.code] || 'Cópia local preservada. Não foi possível concluir a sincronização agora. Confira a conexão e tente novamente.' });
      }
    }
  };
  const sync = () => {
    if (stopped) return Promise.resolve();
    if (running) { again = true; return running; }
    raceRetries = 0;
    running = (async () => { do { again = false; await perform(); } while (again && !stopped); })()
      .finally(() => { running = null; });
    return running;
  };
  return { sync, stop() { stopped = true; },
    async useCloud() {
      if (running) await running;
      const previous = normalizeData(await readLocal());
      const cloud = await remote.read();
      if (!cloud.data) throw new Error('Não há uma cópia na nuvem.');
      if (stopped) return;
      if (serializeData(await readLocal()) !== serializeData(previous)) throw new Error('Os registros foram alterados durante a recuperação. Tente novamente.');
      const nextMeta = { revision: cloud.revision, baseline: serializeData(cloud.data), recovery: previous, syncedAt: Date.now() };
      await replaceLocal(cloud.data, serializeData(previous), nextMeta);
      await saveMeta(nextMeta);
      report({ state: 'synced', message: 'Versão da nuvem recuperada. A cópia anterior deste aparelho está disponível para baixar.' });
    },
  };
}
