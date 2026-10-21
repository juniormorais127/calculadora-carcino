export async function readSyncMetadata(database, fallback = async () => undefined) {
  return (await database.syncMetadata.get('cloud'))?.value ?? await fallback();
}
export async function saveSyncMetadata(database, updates, previous = {}) {
  return database.transaction('rw', database.syncMetadata, async () => {
    const row = await database.syncMetadata.get('cloud');
    const value = { ...previous, ...row?.value, ...updates };
    await database.syncMetadata.put({ key: 'cloud', value });
  });
}
