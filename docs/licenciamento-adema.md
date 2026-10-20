# Licenciamento e central operacional

Área técnica organizada por tópicos: atendimentos, monitoramento ambiental, licenciamento Adema, mapa/histórico, relatórios locais e perfil profissional. Água, solo/sedimento e outros ensaios mantêm parâmetros, unidades e métodos independentes; não há diagnóstico automático.

Os processos de licenciamento e coletas são salvos na nuvem por técnico. Outros técnicos não podem consultá-los. Administradores e Sênior podem acompanhar e editar, com revisão incremental e histórico imutável. Dados ainda não salvos e fotografias locais não aparecem no acompanhamento administrativo. As regras antigas de consentimento de visita e notas privadas permanecem em vigor.

O formulário permite rascunhos incompletos. Vermelho indica campos-base pendentes. O nome da propriedade identifica o rascunho; não são criados CPF, ART, registro profissional, coordenada UTM, outorga, número de licença ou assinatura por suposição.

Modelos oficiais incluídos em `public/adema`, conferidos em 20/10/2026:

- Requerimento de processo técnico ambiental (link vigente na página de modelos da Adema; arquivo publicado em 2024).
- Procuração, revisão março/2026.
- TRA para LS, revisão novembro/2025.
- RCE para LS, revisão março/2026, modelo integral de 13 páginas.
- Lista de aquicultura, revisão novembro/2025, publicada na área de documentos de 2026.
- Análise prévia geral, revisão fevereiro/2026.

Os URLs oficiais estão em `src/services/licensingData.js`; hashes dos originais em `public/adema/sources.json`. Confira mudanças no site do órgão antes de atualizar os PDFs: posições e nomes dos campos dependem da revisão do modelo.

Requerimento mantém os campos AcroForm originais; procuração, TRA e RCE recebem campos editáveis para dados disponíveis. Todo conteúdo informado segue também em anexo paginado para não perder textos longos. O RCE preenche identificação e coordenadas informadas, conservando o modelo completo para o profissional revisar as demais seções. Nenhum documento é licença, assinatura, boleto ou comprovante de protocolo emitido pela Adema. A planta exigida pelo órgão demanda polígonos/camadas e SIRGAS 2000/UTM; os exports antigos de pontos WGS84 não são apresentados como substitutos.

A central separada é `central-operacional/index.html`; a entrada antiga `admin/index.html` continua compatível. Segurança depende de Authentication e regras no servidor, não do nome da URL. E-mail administrativo precisa estar confirmado. Sênior pode provisionar contas administrativas individuais por e-mail, com senha aleatória descartada e link para definição de senha. Não gravar senhas em Firestore nem no código; não criar conta para e-mail que o responsável não tenha indicado. A hierarquia Sênior > administradores > produtores/técnicos permanece.

Não gerar APK automaticamente. Publicar web e regras após testes; APK apenas mediante solicitação explícita do responsável.
