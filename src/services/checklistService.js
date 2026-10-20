import { db } from './db.js';

const KEY = 'checklistBPM';
const LEGACY_KEY = 'carcino_bpm_checklist';

function validChecklist(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, checked]) => typeof checked === 'boolean'));
}

export async function loadChecklist(database = db) {
  const stored = await database.configuracoes.where('chave').equals(KEY).first();
  if (stored) return validChecklist(stored.valor);
  // Old shared-browser entries have no account owner. Keep them in local mode.
  if (database !== db) return {};
  // Migração dos registros da versão anterior, sem enviar dados à rede.
  let legacy = {};
  try { legacy = validChecklist(JSON.parse(localStorage.getItem(LEGACY_KEY))); } catch {}
  if (Object.keys(legacy).length) {
    await saveChecklist(legacy);
    try { localStorage.removeItem(LEGACY_KEY); } catch {}
  }
  return legacy;
}

export async function saveChecklist(value, database = db) {
  await database.transaction('rw', database.configuracoes, async () => {
    const stored = await database.configuracoes.where('chave').equals(KEY).first();
    const row = { chave: KEY, valor: validChecklist(value), updatedAt: new Date().toISOString() };
    if (stored) await database.configuracoes.update(stored.id, row);
    else await database.configuracoes.add(row);
  });
}
