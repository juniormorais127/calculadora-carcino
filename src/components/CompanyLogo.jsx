import React, { useState } from "react";

export default function CompanyLogo({ nome, logo, fundoEscuro = false }) {
  const [failedLogo, setFailedLogo] = useState(null);
  const hasLogo = logo && failedLogo !== logo;
  const initials = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("");

  return (
    <div className={`flex h-16 w-28 shrink-0 items-center justify-center rounded-xl border p-2 ${hasLogo && fundoEscuro ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
      {hasLogo ? (
        <img src={logo} alt={`Logomarca de ${nome}`} className="h-full w-full object-contain" decoding="async" onError={() => setFailedLogo(logo)} />
      ) : (
        <div className="text-center" aria-label={`${nome}: logomarca não cadastrada`}>
          <span className="block text-lg font-bold text-slate-600" aria-hidden="true">{initials}</span>
          <span className="block text-[10px] text-slate-600">Sem logomarca</span>
        </div>
      )}
    </div>
  );
}
