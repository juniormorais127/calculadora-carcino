import { jsPDF } from "jspdf";
import { saveDeviceFile } from './deviceFiles.js';
import { calculateToxicAmmonia } from "./calculatorService.js";

/**
 * Formata número com separadores brasileiros
 */
function formatarNumero(valor, decimais = 0) {
  if (valor === undefined || valor === null || isNaN(valor)) return "--";
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais
  });
}

/**
 * Calcula DOC (Days of Culture)
 */
function calcularDOC(dataPovoamento) {
  if (!dataPovoamento) return "--";
  const diff = Math.floor((new Date() - new Date(dataPovoamento)) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Gera documento PDF estruturado com todos os dados da fazenda
 * @param {Object} dados
 * @param {Object} dados.farmProfile
 * @param {Array} dados.viveiros
 * @param {Array} dados.biometrias
 * @param {Array} dados.qualidadeAgua
 * @param {Boolean} [dados.baixar=true] se true, dispara download no navegador
 * @returns {jsPDF} instancia do jsPDF
 */
export async function gerarRelatorioFazendaPdf({
  farmProfile,
  viveiros = [],
  biometrias = [],
  qualidadeAgua = [],
  baixar = true
} = {}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 182mm
  let currentY = 15;

  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString("pt-BR") + " às " + dataAtual.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dataArquivo = dataAtual.toISOString().split("T")[0];

  const nomeFazenda = farmProfile?.nomeFazenda || "Fazenda de Carcinicultura";
  const produtor = farmProfile?.produtor || "Produtor Rural";
  const localizacao = farmProfile?.localizacao || "Litoral";

  // Helper para quebra de página
  function checarQuebraPagina(alturaNecessaria) {
    if (currentY + alturaNecessaria > pageHeight - 18) {
      doc.addPage();
      currentY = 15;
      desenharCabecalhoCompacto();
    }
  }

  function desenharCabecalhoCompacto() {
    doc.setFillColor(16, 94, 60); // Emerald 800
    doc.rect(marginX, currentY, contentWidth, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`CarcinoGestão - Relatório da Fazenda: ${nomeFazenda}`, marginX + 3, currentY + 4.8);
    doc.setFont("helvetica", "normal");
    doc.text(`Emissão: ${dataFormatada}`, pageWidth - marginX - 3, currentY + 4.8, { align: "right" });
    currentY += 11;
  }

  // ==========================================
  // 1. CABEÇALHO PRINCIPAL
  // ==========================================
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("CARCINOGESTÃO · RELATÓRIO DA FAZENDA", marginX + 6, currentY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229); // Emerald 100
  doc.text("Gestão Zootécnica de Camarão (Litopenaeus vannamei) · Exportação Oficial", marginX + 6, currentY + 14);
  doc.text(`Gerado em: ${dataFormatada}`, pageWidth - marginX - 6, currentY + 14, { align: "right" });

  currentY += 27;

  // ==========================================
  // 2. IDENTIFICAÇÃO DA PROPRIEDADE
  // ==========================================
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(marginX, currentY, contentWidth, 20, 2, 2, "FD");

  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("IDENTIFICAÇÃO DA PROPRIEDADE", marginX + 4, currentY + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Fazenda / Projeto:", marginX + 4, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(nomeFazenda, marginX + 35, currentY + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Produtor Responsável:", marginX + 4, currentY + 17);
  doc.setFont("helvetica", "normal");
  doc.text(produtor, marginX + 39, currentY + 17);

  doc.setFont("helvetica", "bold");
  doc.text("Localização / Região:", marginX + 105, currentY + 12);
  doc.setFont("helvetica", "normal");
  doc.text(localizacao, marginX + 138, currentY + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Status Operacional:", marginX + 105, currentY + 17);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(5, 150, 105);
  doc.text(`${viveiros.filter(v => v.status === "ativo").length} viveiro(s) ativo(s)`, marginX + 138, currentY + 17);

  currentY += 25;

  // ==========================================
  // 3. CONSOLIDAÇÃO DE MÉTRICAS (KPIs)
  // ==========================================
  const viveirosAtivos = viveiros.filter(v => v.status === "ativo");
  const areaTotalM2 = viveirosAtivos.reduce((acc, v) => acc + (Number(v.areaM2) || 0), 0);
  const areaTotalHa = (areaTotalM2 / 10000).toFixed(2);
  const volumeTotalM3 = viveirosAtivos.reduce((acc, v) => acc + (Number(v.volumeM3) || 0), 0);
  const totalPLsEstocadas = viveirosAtivos.reduce((acc, v) => acc + (Number(v.qtdPovoada) || 0), 0);

  // Mapear biometrias recentes
  const ultimaBiometriaPorViveiro = {};
  biometrias.forEach(b => {
    if (!ultimaBiometriaPorViveiro[b.viveiroId] || new Date(b.data) > new Date(ultimaBiometriaPorViveiro[b.viveiroId].data)) {
      ultimaBiometriaPorViveiro[b.viveiroId] = b;
    }
  });

  let biomassaTotalKg = 0;
  let somaPesoMedio = 0;
  let contagemPeso = 0;

  viveirosAtivos.forEach(v => {
    const bio = ultimaBiometriaPorViveiro[v.id];
    if (bio && bio.biomassaKg) {
      biomassaTotalKg += Number(bio.biomassaKg);
      somaPesoMedio += Number(bio.pesoMedioG);
      contagemPeso++;
    }
  });

  const pesoMedioGeral = contagemPeso > 0 ? (somaPesoMedio / contagemPeso).toFixed(1) : "--";

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RESUMO GERAL DA PRODUÇÃO ATIVA", marginX, currentY + 4);
  currentY += 6;

  // 4 cards de KPIs lado a lado
  const cardW = (contentWidth - 9) / 4; // ~43.25mm
  const kpis = [
    { rotulo: "ÁREA ATIVA", valor: `${areaTotalHa} ha`, sub: `${formatarNumero(areaTotalM2)} m²` },
    { rotulo: "VOLUME D'ÁGUA", valor: `${formatarNumero(volumeTotalM3)} m³`, sub: `${viveirosAtivos.length} viveiros` },
    { rotulo: "BIOMASSA TOTAL", valor: `${formatarNumero(biomassaTotalKg)} kg`, sub: biomassaTotalKg > 1000 ? `${(biomassaTotalKg / 1000).toFixed(2)} ton` : "Estimada" },
    { rotulo: "PESO MÉDIO GERAL", valor: `${pesoMedioGeral} g`, sub: `PLs: ${formatarNumero(totalPLsEstocadas)}` }
  ];

  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (cardW + 3);
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.roundedRect(x, currentY, cardW, 16, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(kpi.rotulo, x + 3, currentY + 4.5);

    doc.setFontSize(10.5);
    doc.setTextColor(16, 94, 60); // Emerald 700
    doc.text(kpi.valor, x + 3, currentY + 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, x + 3, currentY + 14.5);
  });

  currentY += 21;

  // ==========================================
  // 4. TABELA DE VIVEIROS CADASTRADOS
  // ==========================================
  checarQuebraPagina(35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`VIVEIROS CADASTRADOS (${viveiros.length})`, marginX, currentY + 4);
  currentY += 6;

  // Cabeçalho da tabela de viveiros
  doc.setFillColor(16, 94, 60); // Emerald 700
  doc.rect(marginX, currentY, contentWidth, 6, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Viveiro", marginX + 2, currentY + 4.2);
  doc.text("Área (m²)", marginX + 48, currentY + 4.2);
  doc.text("Prof.", marginX + 72, currentY + 4.2);
  doc.text("Volume (m³)", marginX + 88, currentY + 4.2);
  doc.text("Povoamento", marginX + 115, currentY + 4.2);
  doc.text("DOC", marginX + 138, currentY + 4.2);
  doc.text("Densidade", marginX + 152, currentY + 4.2);
  doc.text("Status", marginX + 170, currentY + 4.2);

  currentY += 6;

  if (viveiros.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, contentWidth, 7, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text("Nenhum viveiro cadastrado no momento.", marginX + 4, currentY + 4.5);
    currentY += 9;
  } else {
    viveiros.forEach((v, idx) => {
      checarQuebraPagina(7);
      const isZebra = idx % 2 === 1;
      if (isZebra) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, contentWidth, 6, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(String(v.nome || `Viveiro ${idx + 1}`).substring(0, 26), marginX + 2, currentY + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`${formatarNumero(v.areaM2)} m²`, marginX + 48, currentY + 4.2);
      doc.text(`${v.profundidadeM || 1.2} m`, marginX + 72, currentY + 4.2);
      doc.text(`${formatarNumero(v.volumeM3)} m³`, marginX + 88, currentY + 4.2);
      doc.text(String(v.dataPovoamento || "--"), marginX + 115, currentY + 4.2);
      doc.text(`${calcularDOC(v.dataPovoamento)} dias`, marginX + 138, currentY + 4.2);
      doc.text(`${v.densidadePovoamento || 10} c/m²`, marginX + 152, currentY + 4.2);

      if (v.status === "ativo") {
        doc.setTextColor(5, 150, 105);
        doc.text("Ativo", marginX + 170, currentY + 4.2);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text(String(v.status || "Inativo"), marginX + 170, currentY + 4.2);
      }

      currentY += 6;
    });
    currentY += 4;
  }

  // ==========================================
  // 5. ÚLTIMAS BIOMETRIAS E CRESCIMENTO
  // ==========================================
  checarQuebraPagina(35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`ÚLTIMAS MEDIÇÕES DE BIOMETRIA (${biometrias.length} totais)`, marginX, currentY + 4);
  currentY += 6;

  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(marginX, currentY, contentWidth, 6, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Viveiro", marginX + 2, currentY + 4.2);
  doc.text("Data Pesagem", marginX + 50, currentY + 4.2);
  doc.text("Peso Médio", marginX + 78, currentY + 4.2);
  doc.text("Ganho Semanal", marginX + 102, currentY + 4.2);
  doc.text("Sobrev. (%)", marginX + 128, currentY + 4.2);
  doc.text("Biomassa Est.", marginX + 148, currentY + 4.2);
  doc.text("População", marginX + 170, currentY + 4.2);

  currentY += 6;

  if (viveiros.length === 0 || Object.keys(ultimaBiometriaPorViveiro).length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, contentWidth, 7, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text("Nenhuma pesagem de biometria registrada.", marginX + 4, currentY + 4.5);
    currentY += 9;
  } else {
    viveiros.forEach((v, idx) => {
      const bio = ultimaBiometriaPorViveiro[v.id];
      if (!bio) return;

      checarQuebraPagina(6.5);
      const isZebra = idx % 2 === 1;
      if (isZebra) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, contentWidth, 6, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(String(v.nome).substring(0, 28), marginX + 2, currentY + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(String(bio.data), marginX + 50, currentY + 4.2);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 94, 60);
      doc.text(`${bio.pesoMedioG} g`, marginX + 78, currentY + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(13, 148, 136);
      doc.text(bio.ganhoSemanalG ? `+${bio.ganhoSemanalG} g` : "--", marginX + 102, currentY + 4.2);

      doc.setTextColor(51, 65, 85);
      doc.text(`${bio.sobrevivenciaEstimada || 85}%`, marginX + 128, currentY + 4.2);
      doc.text(`${formatarNumero(bio.biomassaKg)} kg`, marginX + 148, currentY + 4.2);
      doc.text(`${formatarNumero(bio.camaroesEstimados)}`, marginX + 170, currentY + 4.2);

      currentY += 6;
    });
    currentY += 4;
  }

  // ==========================================
  // 6. ÚLTIMA QUALIDADE DA ÁGUA POR VIVEIRO
  // ==========================================
  checarQuebraPagina(35);

  const ultimaAguaPorViveiro = {};
  qualidadeAgua.forEach(q => {
    if (!ultimaAguaPorViveiro[q.viveiroId] || new Date(q.data) > new Date(ultimaAguaPorViveiro[q.viveiroId].data)) {
      ultimaAguaPorViveiro[q.viveiroId] = q;
    }
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`ÚLTIMAS ANÁLISES DE QUALIDADE DA ÁGUA (${qualidadeAgua.length} totais)`, marginX, currentY + 4);
  currentY += 6;

  doc.setFillColor(8, 145, 178); // Cyan 600
  doc.rect(marginX, currentY, contentWidth, 6, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Viveiro", marginX + 2, currentY + 4.2);
  doc.text("Data", marginX + 44, currentY + 4.2);
  doc.text("O2 (mg/L)", marginX + 68, currentY + 4.2);
  doc.text("pH", marginX + 88, currentY + 4.2);
  doc.text("Temp (°C)", marginX + 104, currentY + 4.2);
  doc.text("Sal. (ppt)", marginX + 124, currentY + 4.2);
  doc.text("Alcalinidade", marginX + 144, currentY + 4.2);
  doc.text("NH3 Tóxica", marginX + 168, currentY + 4.2);

  currentY += 6;

  if (viveiros.length === 0 || Object.keys(ultimaAguaPorViveiro).length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, contentWidth, 7, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text("Nenhuma análise de qualidade da água registrada.", marginX + 4, currentY + 4.5);
    currentY += 9;
  } else {
    viveiros.forEach((v, idx) => {
      const q = ultimaAguaPorViveiro[v.id];
      if (!q) return;

      checarQuebraPagina(6.5);
      const isZebra = idx % 2 === 1;
      if (isZebra) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, currentY, contentWidth, 6, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(String(v.nome).substring(0, 25), marginX + 2, currentY + 4.2);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(String(q.data), marginX + 44, currentY + 4.2);

      // Oxigênio
      if (q.oxigenio >= 4.0) {
        doc.setTextColor(5, 150, 105);
      } else if (q.oxigenio >= 3.0) {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(225, 29, 72);
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${q.oxigenio}`, marginX + 68, currentY + 4.2);

      // pH
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`${q.ph}`, marginX + 88, currentY + 4.2);
      doc.text(`${q.temperatura}°C`, marginX + 104, currentY + 4.2);
      doc.text(`${q.salinidade}`, marginX + 124, currentY + 4.2);
      doc.text(`${q.alcalinidade} mg/L`, marginX + 144, currentY + 4.2);

      // Amônia tóxica
      const nh3 = calculateToxicAmmonia(q.amoniaTotal, q.ph, q.temperatura, q.salinidade);
      if (nh3) {
        if (nh3.alerta === "critico") {
          doc.setTextColor(225, 29, 72);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(5, 150, 105);
          doc.setFont("helvetica", "normal");
        }
        doc.text(`${nh3.amoniaToxica}`, marginX + 168, currentY + 4.2);
      } else {
        doc.setTextColor(100, 116, 139);
        doc.text("--", marginX + 168, currentY + 4.2);
      }

      currentY += 6;
    });
    currentY += 4;
  }

  // ==========================================
  // 7. TERMO DE VERIFICAÇÃO E ASSINATURA
  // ==========================================
  checarQuebraPagina(25);
  currentY += 4;

  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  doc.setLineDashPattern([], 0); // Reset dash

  currentY += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Este documento consolida os registros biométricos, populacionais e parâmetros físico-químicos lançados pelo produtor no CarcinoGestão.", marginX, currentY);
  currentY += 4;
  doc.text("Armazenamento seguro e processamento em conformidade com as Boas Práticas de Manejo (BPM) da Carcinicultura.", marginX, currentY);

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`CarcinoGestão · ${nomeFazenda} · Gerado em ${dataFormatada}`, marginX, pageHeight - 8);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
  }

  // Salvar / Baixar
  if (baixar && typeof window !== "undefined") {
    const nomeLimpo = nomeFazenda.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    await saveDeviceFile(doc.output('blob'), `relatorio-fazenda-${nomeLimpo}-${dataArquivo}.pdf`);
  }

  return doc;
}
