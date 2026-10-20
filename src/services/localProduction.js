export async function readLocalProduction(database) {
  await database.open();
  // One read-only snapshot; startup must never wait for a bookkeeping write.
  return database.transaction('r', database.viveiros, database.biometrias, database.qualidadeAgua, database.configuracoes, async () => {
    const [viveiros, biometrias, qualidadeAgua, farmProfile] = await Promise.all([
      database.viveiros.toArray(), database.biometrias.toArray(), database.qualidadeAgua.toArray(),
      database.configuracoes.where('chave').equals('perfilFazenda').first(),
    ]);
    return { viveiros, biometrias, qualidadeAgua, farmProfile: farmProfile || null };
  });
}

export function withLocalDeadline(operation, milliseconds = 5000) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('O armazenamento local demorou para responder. Feche outras abas do site e toque em Tentar novamente. Nenhum registro foi apagado.'), { code: 'local/timeout' })), milliseconds);
  });
  return Promise.race([operation, deadline]).finally(() => clearTimeout(timer));
}
