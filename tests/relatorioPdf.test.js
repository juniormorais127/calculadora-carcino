import test from "node:test";
import assert from "node:assert/strict";
import { gerarRelatorioFazendaPdf } from "../src/services/relatorioPdfService.js";

test("relatório em PDF da fazenda", async (t) => {
  await t.test("gera PDF com dados completos da fazenda", () => {
    const mockFarmProfile = {
      nomeFazenda: "Fazenda Maré Alta",
      produtor: "João Silva",
      localizacao: "Tibau do Sul - RN"
    };

    const mockViveiros = [
      {
        id: 1,
        nome: "Viveiro 01 - Engorda",
        areaM2: 10000,
        profundidadeM: 1.2,
        volumeM3: 12000,
        dataPovoamento: "2026-08-01",
        densidadePovoamento: 15,
        qtdPovoada: 150000,
        status: "ativo"
      },
      {
        id: 2,
        nome: "Viveiro 02 - Berçário",
        areaM2: 5000,
        profundidadeM: 1.0,
        volumeM3: 5000,
        dataPovoamento: "2026-09-10",
        densidadePovoamento: 30,
        qtdPovoada: 150000,
        status: "ativo"
      }
    ];

    const mockBiometrias = [
      {
        id: 101,
        viveiroId: 1,
        data: "2026-09-25",
        pesoMedioG: 12.8,
        sobrevivenciaEstimada: 85,
        biomassaKg: 1632,
        ganhoSemanalG: 1.4,
        camaroesEstimados: 127500
      }
    ];

    const mockAgua = [
      {
        id: 201,
        viveiroId: 1,
        data: "2026-09-25",
        horario: "Manhã (06:00)",
        oxigenio: 4.8,
        ph: 8.1,
        temperatura: 28.5,
        salinidade: 22,
        alcalinidade: 130,
        amoniaTotal: 0.2
      }
    ];

    const doc = gerarRelatorioFazendaPdf({
      farmProfile: mockFarmProfile,
      viveiros: mockViveiros,
      biometrias: mockBiometrias,
      qualidadeAgua: mockAgua,
      baixar: false // no download in test
    });

    assert.ok(doc, "Instância de jsPDF deve ser retornada");
    assert.strictEqual(typeof doc.output, "function", "Deve possuir método output()");
    
    const pdfDataUri = doc.output("datauristring");
    assert.ok(pdfDataUri.startsWith("data:application/pdf"), "Output deve ser um PDF válido");
    assert.ok(doc.getNumberOfPages() >= 1, "Deve conter ao menos 1 página");
  });

  await t.test("gera PDF mesmo com base vazia sem estourar erros", () => {
    const doc = gerarRelatorioFazendaPdf({
      farmProfile: null,
      viveiros: [],
      biometrias: [],
      qualidadeAgua: [],
      baixar: false
    });

    assert.ok(doc);
    assert.ok(doc.getNumberOfPages() >= 1);
  });
});
