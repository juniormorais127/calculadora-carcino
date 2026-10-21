import React, { useEffect, useRef, useState } from "react";
import { trackPurchase } from '../services/purchaseTracking.js';
import { 
  Store, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Mail, 
  Search, 
  Filter, 
  Sparkles, 
  Building2, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Megaphone,
  Briefcase
} from "lucide-react";
import { FABRICANTES_RACAO, VENDEDORES_POR_ESTADO, ANUNCIOS_PATROCINADORES } from "../data/fabricantesRacao.js";
import CompanyLogo from "./CompanyLogo.jsx";
import { RANKING_CAMARAO, FONTE_RANKING_CAMARAO, posicaoProducao } from "../data/rankingCamarao.js";

const ESTADOS_CADASTRADOS = new Set(VENDEDORES_POR_ESTADO.map(v => v.estado));
const ESTADOS = [
  { sigla: "TODOS", nome: "Todos os Estados" },
  ...RANKING_CAMARAO.filter(estado => ESTADOS_CADASTRADOS.has(estado.sigla)),
  ...[...ESTADOS_CADASTRADOS].filter(sigla => !RANKING_CAMARAO.some(e => e.sigla === sigla))
    .map(sigla => ({ sigla, nome: VENDEDORES_POR_ESTADO.find(v => v.estado === sigla).estadoNome })),
];
const ESTADOS_EM_DESTAQUE = [ESTADOS[0], ...RANKING_CAMARAO.slice(0, 6)];

export default function MercadoView({ estadoInicial = "TODOS", marcaInicial = "TODAS", onVoltarCalculos }) {
  const measured = useRef(false);
  useEffect(() => { if (!measured.current) { measured.current = true; void trackPurchase('view'); } }, []);
  const [estadoFiltro, setEstadoFiltro] = useState(estadoInicial);
  const [marcaFiltro, setMarcaFiltro] = useState(marcaInicial);
  const [buscaTexto, setBuscaTexto] = useState("");
  const [modalAnunciarAberto, setModalAnunciarAberto] = useState(false);
  const [formAnuncio, setFormAnuncio] = useState({
    empresa: "",
    contato: "",
    whatsapp: "",
    estado: "RN",
    tipo: "Ração"
  });
  const [sucessoAnuncio, setSucessoAnuncio] = useState(false);

  // Filtragem dos vendedores
  const vendedoresFiltrados = VENDEDORES_POR_ESTADO.filter(v => {
    // Filtro por Estado
    if (estadoFiltro !== "TODOS" && v.estado !== estadoFiltro) return false;

    // Filtro por Marca
    if (marcaFiltro !== "TODAS") {
      const temMarca = v.marcas.some(m => m.toLowerCase().includes(marcaFiltro.toLowerCase())) ||
        v.tiposProdutos.some(p => p.toLowerCase().includes(marcaFiltro.toLowerCase()));
      if (!temMarca) return false;
    }

    // Busca textual livre
    if (buscaTexto.trim()) {
      const termo = buscaTexto.toLowerCase();
      const matchTexto = 
        v.empresa.toLowerCase().includes(termo) ||
        v.nomeContato.toLowerCase().includes(termo) ||
        v.cidadeBase.toLowerCase().includes(termo) ||
        v.estadoNome.toLowerCase().includes(termo) ||
        v.atendeCidades.some(c => c.toLowerCase().includes(termo)) ||
        v.marcas.some(m => m.toLowerCase().includes(termo));
      if (!matchTexto) return false;
    }

    return true;
  }).sort((a, b) => {
    const posicaoA = posicaoProducao(a.estado);
    const posicaoB = posicaoProducao(b.estado);
    return posicaoA === posicaoB ? 0 : posicaoA - posicaoB;
  });

  const handleSubmitAnuncio = (e) => {
    e.preventDefault();
    setSucessoAnuncio(true);
    setTimeout(() => {
      setSucessoAnuncio(false);
      setModalAnunciarAberto(false);
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Topo / Header da Aba */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 px-2.5 py-0.5 rounded-full">
                Guia Comercial & Intermediação
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Store className="w-6 h-6 text-emerald-600" />
              Onde Comprar & Representantes por Estado
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Encontre o distribuidor oficial e vendedor local de rações (ADM, Guabi, AquaNutri), probióticos de solo e insumos da sua região para intermediar cotações e compras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalAnunciarAberto(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition-all shadow-sm active:scale-95"
            >
              <Megaphone className="w-4 h-4" />
              <span>Anunciar Minha Empresa</span>
            </button>
            {onVoltarCalculos && (
              <button
                onClick={onVoltarCalculos}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-2xl text-xs transition-all"
              >
                Voltar aos Cálculos
              </button>
            )}
          </div>
        </div>

        {/* Vitrine de Fabricantes Homologados */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Fabricantes de Ração e Insumos Cadastrados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {FABRICANTES_RACAO.map((fab) => (
              <div 
                key={fab.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 hover:bg-emerald-50/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <CompanyLogo nome={fab.nome} logo={fab.logo} fundoEscuro={fab.logoFundoEscuro} />
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Homologado
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{fab.nome}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {fab.slogan}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 font-bold block">Juvenil (PB):</span>
                      <span className="font-black text-emerald-700">{fab.fases.juvenil.pbPercent}% PB</span>
                      <span className="text-[10px] text-slate-400 block">{fab.fases.juvenil.pelletMm}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-500 font-bold block">Engorda (PB):</span>
                      <span className="font-black text-amber-700">{fab.fases.engorda.pbPercent}% PB</span>
                      <span className="text-[10px] text-slate-400 block">{fab.fases.engorda.pelletMm}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    void trackPurchase('brand', { id: fab.id, name: fab.nome, category: 'Ração' });
                    setMarcaFiltro(fab.nome.includes("ADM") ? "ADM" : fab.nome.includes("Guabi") ? "Guabi" : "AquaNutri");
                  }}
                  className="mt-3 w-full bg-white hover:bg-slate-100 text-slate-700 font-black text-xs py-2 px-3 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Filtrar Vendedores {fab.logoText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Seletor de Estados */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Selecione o Estado (UF):
          </label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {ESTADOS_EM_DESTAQUE.map((est) => (
              <button
                key={est.sigla}
                title={est.sigla === "TODOS" ? est.nome : est.posicao
                  ? `${est.posicao}º — ${est.nome}: ${(est.producaoKg / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t em ${FONTE_RANKING_CAMARAO.ano}`
                  : `${est.nome}: sem produção registrada no levantamento de ${FONTE_RANKING_CAMARAO.ano}`}
                aria-pressed={estadoFiltro === est.sigla}
                onClick={() => setEstadoFiltro(est.sigla)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  estadoFiltro === est.sigla
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                }`}
              >
                {est.posicao ? `${est.posicao}º ${est.sigla}` : est.sigla}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Os seis maiores produtores de camarão de cultivo, em ordem de produção.
            {" "}<a href={FONTE_RANKING_CAMARAO.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline underline-offset-2">Fonte: IBGE/PPM {FONTE_RANKING_CAMARAO.ano}</a>.
          </p>
        </div>

        {/* Linha com Busca e Filtro de Marca */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cidade, representante ou município..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={marcaFiltro}
              onChange={(e) => setMarcaFiltro(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="TODAS">Todas as Marcas e Insumos</option>
              <option value="ADM">ADM Nutrição Animal</option>
              <option value="Guabi">Guabi Aqua (Linha Poti)</option>
              <option value="AquaNutri">AquaNutri</option>
              <option value="Probióticos">Probióticos de Solo & Água</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listagem de Vendedores Encontrados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-600">
            {vendedoresFiltrados.length} representante(s) encontrado(s) em {estadoFiltro === "TODOS" ? "todos os estados" : estadoFiltro}
          </span>
          {(estadoFiltro !== "TODOS" || marcaFiltro !== "TODAS" || buscaTexto) && (
            <button
              onClick={() => {
                setEstadoFiltro("TODOS");
                setMarcaFiltro("TODAS");
                setBuscaTexto("");
              }}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {vendedoresFiltrados.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">Nenhum vendedor encontrado com estes filtros</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tente selecionar outro estado ou limpar os termos da busca. Você também pode cadastrar ou sugerir um distribuidor local da sua cidade.
            </p>
            <button
              onClick={() => {
                setEstadoFiltro("TODOS");
                setMarcaFiltro("TODAS");
                setBuscaTexto("");
              }}
              className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              Ver todos os representantes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendedoresFiltrados.map((v) => (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-3">
                        <CompanyLogo nome={v.empresa} logo={v.logo} fundoEscuro={v.logoFundoEscuro} />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          {v.estado}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {v.cidadeBase}
                        </span>
                        {v.destaque && (
                          <span className="bg-amber-500/15 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                            Revenda Destaque
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {v.empresa}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Contato: <strong className="text-slate-800">{v.nomeContato}</strong> ({v.regiao})
                      </p>
                    </div>
                  </div>

                  {/* Marcas Representadas */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Marcas Homologadas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {v.marcas.map((m, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cidades Atendidas */}
                  <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 text-[11px] text-slate-600">
                    <span className="font-bold text-slate-700 block mb-0.5">Polos atendidos:</span>
                    <p className="truncate">{v.atendeCidades.join(" · ")}</p>
                  </div>
                </div>

                {/* Botões de Contato / Intermediação */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <a
                    onClick={() => void trackPurchase('whatsapp', { id: v.id, name: v.empresa, category: 'Vendedor · vários produtos' })}
                    href={`https://wa.me/55${v.whatsapp}?text=${encodeURIComponent(
                      `Olá ${v.nomeContato}! Encontrei seu contato no CarcinoGestão. Gostaria de fazer uma cotação de ração/insumos para minha fazenda de camarão no estado de ${v.estadoNome}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    onClick={() => void trackPurchase('phone', { id: v.id, name: v.empresa, category: 'Vendedor · vários produtos' })}
                    href={`tel:${v.telefone}`}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-3 rounded-xl text-xs font-bold transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>{v.telefone}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600">Contabilizamos acessos e cliques nesta área para medir o interesse nas ofertas e contatos. Um clique não confirma uma compra.</p>
      {/* Card Institucional para Empresas que querem Anunciar a Logo */}
      <div className="light-panel bg-blue-50 text-slate-900 rounded-3xl p-6 shadow-md border border-emerald-500/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Espaço para Patrocinadores & Fabricantes
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Sua empresa quer divulgar sua logo e conectar revendedores aos produtores?
            </h3>
            <p className="text-xs text-slate-300">
              Oferecemos vitrines contextuais integradas aos cálculos de ração e solo. O produtor faz a biometria, confere as informações nutricionais e cai direto no WhatsApp do seu vendedor local.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => setModalAnunciarAberto(true)}
              className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs transition-all shadow-sm"
            >
              Fale Conosco para Anunciar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Anúncio / Cadastro de Empresa */}
      {modalAnunciarAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Anunciar no CarcinoGestão</h3>
              </div>
              <button
                onClick={() => setModalAnunciarAberto(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            {sucessoAnuncio ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-900">Solicitação enviada com sucesso!</p>
                <p className="text-xs text-emerald-700">Nossa equipe comercial entrará em contato para liberar seu banner e cadastro de vendedores.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAnuncio} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nome da Empresa / Marca:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Minha Empresa de Nutrição"
                    value={formAnuncio.empresa}
                    onChange={(e) => setFormAnuncio({ ...formAnuncio, empresa: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Responsável Comercial:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={formAnuncio.contato}
                    onChange={(e) => setFormAnuncio({ ...formAnuncio, contato: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp para Contato:</label>
                  <input
                    type="tel"
                    required
                    placeholder="(XX) 9XXXX-XXXX"
                    value={formAnuncio.whatsapp}
                    onChange={(e) => setFormAnuncio({ ...formAnuncio, whatsapp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Estado Sede:</label>
                    <select
                      value={formAnuncio.estado}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, estado: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      {ESTADOS.filter(e => e.sigla !== "TODOS").map(e => (
                        <option key={e.sigla} value={e.sigla}>{e.sigla} - {e.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Segmento:</label>
                    <select
                      value={formAnuncio.tipo}
                      onChange={(e) => setFormAnuncio({ ...formAnuncio, tipo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Ração">Rações & Nutrição</option>
                      <option value="Probióticos">Probióticos de Solo/Água</option>
                      <option value="Equipamentos">Aeradores & Equipamentos</option>
                      <option value="Laboratório">Pós-Larvas (PL)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAnunciarAberto(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    Enviar Proposta
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
