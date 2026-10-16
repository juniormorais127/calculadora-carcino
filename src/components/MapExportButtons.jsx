import React, { useState } from 'react';
const button = 'min-h-11 rounded-xl border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-emerald-700';
export default function MapExportButtons({ records, filename = 'locais-carcinogestao', loading = false }) {
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState('');
  const count = records.filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)).length;
  async function download(format) {
    setBusy(format); setError(''); setMessage('');
    try {
      const api = await import('../services/mapExport.js');
      const data = format === 'kml' ? api.mapKml(records) : await api.mapShapefileZip(records);
      const blob = new Blob([data], { type: format === 'kml' ? 'application/vnd.google-earth.kml+xml' : 'application/zip' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.${format === 'kml' ? 'kml' : 'zip'}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(`${count} registro(s) exportado(s). ${format === 'kml' ? 'Abra o KML no Google Earth Pro.' : 'Extraia o ZIP mantendo os arquivos juntos. O CSV inclui os relatórios completos.'}`);
    } catch (err) { setError(err.message || 'Não foi possível gerar o arquivo. Tente novamente.'); }
    finally { setBusy(''); }
  }
  return <div className="space-y-2 border-t border-slate-200 pt-4"><h3 className="font-semibold text-sm">Baixar locais e informações das visitas</h3><p className="text-xs text-slate-600">{count} registro(s) carregado(s) com coordenadas. Exporta pontos e dados compartilhados, sem fotos, apelidos ou anotações privadas. O Shapefile inclui um CSV com os textos completos.</p><div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={!!busy || loading || !count} onClick={() => void download('kml')}>{busy === 'kml' ? 'Gerando KML…' : 'Baixar KML — Google Earth Pro'}</button><button type="button" className={button} disabled={!!busy || loading || !count} onClick={() => void download('shp')}>{busy === 'shp' ? 'Gerando Shapefile…' : 'Baixar Shapefile (.zip)'}</button></div>{loading && <p role="status" className="text-xs text-slate-600">Aguardando os registros para exportação…</p>}{error && <p role="alert" className="text-sm text-rose-900">{error}</p>}{message && <p role="status" className="text-sm text-emerald-900">{message}</p>}</div>;
}
