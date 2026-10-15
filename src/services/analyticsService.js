// Teste local: nenhum evento sai do navegador, sem identificadores de pessoas.
export const ANALYTICS_KEY = 'carcino-analytics-local-v1';
export const PAGINAS_ANALYTICS = {
  dashboard: 'Início', viveiros: 'Viveiros', biometria: 'Biometria', agua: 'Qualidade da água',
  calculadoras: 'Calculadoras', sanidade: 'Sanidade', mercado: 'Mercado', backup: 'Ajustes',
};

function diaLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function createAnalyticsStore(getStorage, now = () => new Date()) {
  let iniciou = false;
  let ultimaPagina = null;
  const read = () => {
    try {
      const parsed = JSON.parse(getStorage().getItem(ANALYTICS_KEY) || '{"dias":{}}');
      if (parsed?.versao && parsed.versao !== 1) return { dias: {}, disponivel: false };
      if (!parsed?.dias || typeof parsed.dias !== 'object' || Array.isArray(parsed.dias)) throw new Error('invalid');
      // Only accept our aggregate schema; damaged local storage must not break the app.
      const dias = {};
      for (const [date, data] of Object.entries(parsed.dias)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !data || typeof data !== 'object') continue;
        const counters = value => Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {})
          .filter(([key, count]) => /^[a-z0-9_-]+(?::(?:whatsapp|telefone))?$/.test(key) && Number.isSafeInteger(count) && count >= 0));
        dias[date] = {
          acessos: Number.isSafeInteger(data.acessos) && data.acessos >= 0 ? data.acessos : 0,
          paginas: counters(data.paginas), contatos: counters(data.contatos),
        };
      }
      return { dias, disponivel: true };
    } catch { return { dias: {}, disponivel: false }; }
  };
  const write = update => {
    try {
      const { dias } = read();
      const date = now();
      const cutoff = new Date(date); cutoff.setDate(cutoff.getDate() - 89);
      for (const day of Object.keys(dias)) if (day < diaLocal(cutoff) || day > diaLocal(date)) delete dias[day];
      const today = diaLocal(date);
      dias[today] ||= { acessos: 0, paginas: {}, contatos: {} };
      update(dias[today]);
      getStorage().setItem(ANALYTICS_KEY, JSON.stringify({ versao: 1, dias }));
      return true;
    } catch { return false; }
  };
  return {
    iniciarAcesso() {
      if (iniciou) return;
      iniciou = write(day => { day.acessos++; });
    },
    pagina(page) {
      if (!Object.hasOwn(PAGINAS_ANALYTICS, page)) { ultimaPagina = null; return; }
      if (page === ultimaPagina) return;
      if (write(day => { day.paginas[page] = (day.paginas[page] || 0) + 1; })) ultimaPagina = page;
    },
    contato(id, canal) {
      if (!/^vendedor-[a-z]{2}-\d+$/.test(id) || !['whatsapp', 'telefone'].includes(canal)) return false;
      return write(day => {
        const key = `${id}:${canal}`;
        day.contatos[key] = (day.contatos[key] || 0) + 1;
      });
    },
    resumo(periodo = 7) {
      const date = now();
      const cutoff = new Date(date); cutoff.setDate(cutoff.getDate() - Math.min(90, Math.max(1, periodo)) + 1);
      const data = read();
      const resumo = { acessos: 0, paginas: {}, contatos: {}, disponivel: data.disponivel };
      for (const [day, counts] of Object.entries(data.dias)) {
        if (day < diaLocal(cutoff) || day > diaLocal(date)) continue;
        resumo.acessos += counts.acessos;
        for (const group of ['paginas', 'contatos']) for (const [key, count] of Object.entries(counts[group])) {
          resumo[group][key] = (resumo[group][key] || 0) + count;
        }
      }
      return resumo;
    },
    limpar() {
      try { getStorage().removeItem(ANALYTICS_KEY); return true; } catch { return false; }
    },
  };
}

export const analytics = createAnalyticsStore(() => window.localStorage);
