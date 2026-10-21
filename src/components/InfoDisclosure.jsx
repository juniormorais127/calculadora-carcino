import React, { useId, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

/** Click/touch and keyboard help. Guidance stays in the page flow, never over fields. */
export default function InfoDisclosure({ label, children, className = '', panelClassName = '', compact = false }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const trigger = useRef(null);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <div className={className} onKeyDown={event=>{if(event.key==='Escape'&&open){event.stopPropagation();close();}}}>
    <button ref={trigger} type="button" aria-label={`Informações: ${label}`} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(value=>!value)} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"><Info className="size-5" aria-hidden="true"/><span className={compact?'sr-only':''}>Informações</span></button>
    <div id={id} hidden={!open} className={`rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-normal leading-relaxed text-blue-950 ${panelClassName}`}>
      <div className="flex items-start gap-3"><div className="min-w-0 flex-1">{children}</div><button type="button" aria-label={`Fechar informações: ${label}`} className="-mr-2 -mt-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-blue-900 hover:bg-blue-100" onClick={close}><X className="size-4" aria-hidden="true"/></button></div>
    </div>
  </div>;
}
