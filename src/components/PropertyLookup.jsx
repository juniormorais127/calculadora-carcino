import React, { useEffect, useId, useState } from 'react';
import { searchRegisteredProperties } from '../services/technicalVisits.js';

export default function PropertyLookup({ value, recipientUid, onChange, onSelect, search = searchRegisteredProperties, className }) {
  const id = useId();
  const [options, setOptions] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [searched, setSearched] = useState(false), [active, setActive] = useState(-1);
  useEffect(() => {
    let disposed = false;
    setOptions([]); setError(''); setSearched(false); setActive(-1); setBusy(false);
    if (recipientUid || value.trim().length < 2) return;
    setBusy(true);
    const timer = setTimeout(async () => {
      try { const found = await search(value); if (!disposed) { setOptions(found); setSearched(true); } }
      catch { if (!disposed) setError('Não foi possível buscar os cadastros. Você pode informar o nome manualmente.'); }
      finally { if (!disposed) setBusy(false); }
    }, 300);
    return () => { disposed = true; clearTimeout(timer); };
  }, [value, recipientUid, search]);
  function choose(item) { onSelect(item); setOptions([]); setActive(-1); }
  return <div className="space-y-2" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOptions([]); }}>
    <label htmlFor={id} className="block text-sm font-semibold">Nome da propriedade</label>
    <input id={id} required maxLength={200} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={options.length > 0} aria-controls={`${id}-options`} aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined} value={value} onChange={event => onChange(event.target.value)} className={className} placeholder="Digite pelo menos 2 letras para buscar" onKeyDown={event => {
      if (event.key === 'ArrowDown' && options.length) { event.preventDefault(); setActive(index => (index + 1) % options.length); }
      if (event.key === 'ArrowUp' && options.length) { event.preventDefault(); setActive(index => index <= 0 ? options.length - 1 : index - 1); }
      if (event.key === 'Enter' && active >= 0 && options[active]) { event.preventDefault(); choose(options[active]); }
      if (event.key === 'Escape') { setOptions([]); setActive(-1); }
    }} />
    {options.length > 0 && <ul id={`${id}-options`} role="listbox" aria-label="Propriedades encontradas" className="rounded-xl border border-slate-300 bg-white divide-y divide-slate-200">{options.map((item, index) => <li key={item.ownerUid} role="presentation"><button type="button" role="option" id={`${id}-${index}`} aria-selected={active === index} onClick={() => choose(item)} className={`min-h-11 w-full px-3 py-3 text-left text-sm hover:bg-emerald-50 ${active === index ? 'bg-emerald-50' : ''}`}><strong>{item.name}</strong><span className="block text-xs text-slate-600">Código do cadastro: {item.ownerUid.slice(-6)}</span></button></li>)}</ul>}
    {busy && <p role="status" className="text-xs text-slate-600">Buscando propriedades…</p>}
    {error && <p className="text-xs text-amber-900">{error}</p>}
    {recipientUid ? <p className="text-sm text-emerald-900">Propriedade vinculada. O produtor receberá o aviso na conta dele, sem precisar informar e-mail.</p> : <p className="text-xs text-slate-600">{searched && !options.length ? 'Nenhuma propriedade selecionada. ' : ''}Selecione um cadastro encontrado para avisar o produtor pelo aplicativo. Sem vínculo ou e-mail, o registro ficará disponível somente para você e a administração.</p>}
  </div>;
}
