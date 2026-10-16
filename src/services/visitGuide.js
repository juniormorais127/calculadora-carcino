import { readLocalVisitPhotos } from './localVisitPhotos.js';
import { LICENSE_LABELS, VISIT_LABELS } from './technicalVisitData.js';
export async function downloadVisitGuide(user, visit, storageKey, includePhotos) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF(); let y = 22;
  function line(text, size = 11) {
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text || 'Não informado'), 174);
    for (const row of lines) { if (y > 277) { pdf.addPage(); y = 22; } pdf.text(row, 18, y); y += size === 16 ? 9 : 6; }
    y += 3;
  }
  line('CarcinoGestão — Guia de visita técnica', 16);
  line(`Propriedade: ${visit.farmName || visit.propertyName}`);
  if (visit.clientName) line(`Produtor: ${visit.clientName}`);
  if (visit.address) line(`Endereço: ${visit.address}`);
  line(`Técnico: ${visit.technicianName || user.email}`);
  if (visit.creaNumber) line(`CREA: ${visit.creaNumber}`);
  line(`Data da visita: ${visit.visitedOn}`);
  line(`Situação: ${VISIT_LABELS[visit.status] || 'Aguardando análise do produtor'}`);
  line('Relatório do atendimento', 13); line(visit.summary);
  if (Number.isFinite(visit.latitude)) line(`Coordenadas: ${visit.latitude}, ${visit.longitude}`);
  line(LICENSE_LABELS[visit.licenseStatus]);
  if (visit.licenseStatus === 'licensed') line(`Licença: ${visit.licenseNumber} | Cadastro: ${visit.licenseRegisteredOn} | Vencimento: ${visit.licenseExpiresOn}`);
  line('As informações foram declaradas no atendimento. Esta guia não substitui licença ou documento emitido pelo órgão competente.');
  if (includePhotos) {
    const files = await readLocalVisitPhotos(user.uid, storageKey);
    for (let index = 0; index < files.length; index++) {
      const bitmap = await createImageBitmap(files[index].blob);
      try {
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        pdf.addPage(); y = 22; line(`Foto ${index + 1} — ${files[index].name}`, 13);
        const width = Math.min(174, 235 * canvas.width / canvas.height), height = width * canvas.height / canvas.width;
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 18, y, width, height);
      } finally { bitmap.close(); }
    }
  }
  pdf.save(`guia-visita-${visit.visitedOn}-${visit.id || 'tecnica'}.pdf`);
}
