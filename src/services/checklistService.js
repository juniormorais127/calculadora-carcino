import { db } from './db.js';

const KEY = 'checklistBPM';
const LEGACY_KEY = 'carcino_bpm_checklist';

function validChecklist(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, checked]) => typeof checked === 'boolean'));
}

export async function loadChecklist() {
  const stored = await db.configuracoes.where('chave').equals(KEY).first();
  if (stored) return validChecklist(stored.valor);
  // Migração dos registros da versão anterior, sem enviar dados à rede.
  let legacy = {};
  try { legacy = validChecklist(JSON.parse(localStorage.getItem(LEGACY_KEY))); } catch {}
  if (Object.keys(legacy).length) {
    await saveChecklist(legacy);
    try { localStorage.removeItem(LEGACY_KEY); } catch {}
  }
  return legacy;
}

export async function saveChecklist(value) {
  await db.transaction('rw', db.configuracoes, async () => {
    const stored = await db.configuracoes.where('chave').equals(KEY).first();
    const row = { chave: KEY, valor: validChecklist(value), updatedAt: new Date().toISOString() };
    if (stored) await db.configuracoes.update(stored.id, row);
    else await db.configuracoes.add(row);
  });
}
