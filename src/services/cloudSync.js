import { serializeData, normalizeData, isEmptyData } from './cloudData.js';

// Dependencies are injected so offline/error/conflict paths can be tested without credentials.
export function createCloudSync({ remote, readLocal, replaceLocal, readMeta, saveMeta, onStatus = () => {} }) {
  let stopped = false;
  let running = null;
  let again = false;
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
      if (dirty && cloud.revision !== (meta?.revision || 0)) {
        // An interrupted previous publication can already match the saved local copy.
        if (!cloud.data || serializeData(cloud.data) !== signature) {
          report({ state: 'conflict', message: 'Há alterações diferentes neste aparelho e na nuvem. Exporte seu backup antes de escolher a versão que deseja manter.' });
          return;
        }
      }
      if (cloud.data && (!dirty || serializeData(cloud.data) === signature)) {
        if (serializeData(cloud.data) !== signature) {
          // Do not overwrite an edit made while the cloud request was in flight.
          if (serializeData(await readLocal()) !== signature) { again = true; return; }
          await replaceLocal(cloud.data, signature);
        }
        await saveMeta({ revision: cloud.revision, baseline: serializeData(cloud.data), syncedAt: Date.now() });
      } else if (dirty) {
        const revision = await remote.write(local, cloud.revision);
        if (stopped) return;
        await saveMeta({ revision, baseline: signature, syncedAt: Date.now() });
      } else if (!meta) {
        await saveMeta({ revision: 0, baseline: signature, syncedAt: Date.now() });
      }
      if (serializeData(await readLocal()) !== (await readMeta())?.baseline) { again = true; return; }
      report({ state: 'synced', message: 'Dados salvos na sua conta.' });
    } catch (error) {
      if (error.code === 'sync/conflict') {
        report({ state: 'conflict', message: 'Outro aparelho salvou alterações. Exporte seu backup antes de escolher qual versão manter.' });
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
      await replaceLocal(cloud.data, serializeData(previous));
      await saveMeta({ revision: cloud.revision, baseline: serializeData(cloud.data), recovery: previous, syncedAt: Date.now() });
      report({ state: 'synced', message: 'Versão da nuvem recuperada. A cópia anterior deste aparelho está disponível para baixar.' });
    },
  };
}
