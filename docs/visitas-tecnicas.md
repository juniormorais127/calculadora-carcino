# Visitas técnicas

O cliente abre **Minha conta → Visitas técnicas e autorizações**. Técnicos de
campo têm a seção **Meus atendimentos**, onde encontram seu código de conta.
Esse código pode ser informado pelo cliente ou pela administração para solicitar
uma autorização. O pedido permanece pendente até a auditoria na aba
**Autorizações**, com justificativa obrigatória para aprovar, recusar ou solicitar
ajustes. O próprio solicitante e o técnico atendente não podem aprovar o pedido.

A autorização permite consultar somente a projeção compartilhada do cadastro:
nome da propriedade, identificação dos viveiros e coordenadas. O cliente deve
abrir o site e concluir a sincronização para atualizar essa projeção. Ela não
inclui biometrias, alimentação, dados de água ou situação de licenciamento.
Revogar a autorização bloqueia novas consultas e visitas. O técnico mantém seu
próprio histórico de visitas já realizadas.

Cada visita exige data e relatório. O técnico pode propor uma correção de
coordenadas e informar situação, número e datas do licenciamento. O cliente vê
um aviso dentro do site e pode aceitar ou recusar o conjunto do relatório.
Não há envio de SMS, e-mail ou WhatsApp neste fluxo.

O aceite registra a decisão no Firestore; os ajustes de localização são
aplicados ao banco da conta e seguem a sincronização de produção. Marcadores
por visita tornam a aplicação idempotente. Se o cadastro mudar desde a visita,
o sistema bloqueia a substituição e pede nova conferência. Recusa não altera
o cadastro. Relatórios enviados e decisões não podem ser reescritos pelo técnico.

O relatório enviado ao cliente é separado das anotações privadas opcionais.
Somente a conta autora lê suas anotações, inclusive no servidor. Administradores
e Sênior leem relatórios e mapas, mas não essas anotações. Cada técnico consulta
somente os próprios relatórios, mesmo se outro técnico estiver autorizado na
mesma propriedade. O dono da propriedade consulta os relatórios que recebeu.

O mapa usa pontos das visitas e o último registro de cada técnico por viveiro.
Exibe o licenciamento informado pelo técnico, com o estado de aceite do cliente.
Isso não corresponde a uma validação oficial do licenciamento. O mapa usa
Leaflet, satélite Esri e mosaicos do OpenStreetMap, com atribuição, carregados apenas quando
existem pontos; o fundo depende de internet.

## Verificação

`npm test` executa validações e testes da aplicação local dos ajustes.
`npx playwright test e2e/technical-visits.spec.js --project chromium` cobre
registro, revisão, aceite, alteração no banco e separação das notas na interface.

Com Java 21 ou superior disponível no PATH, as regras são verificadas em um
projeto demonstrativo isolado, sem usuários ou dados reais:

```sh
npx --yes --package firebase-tools@15.34.0 firebase emulators:exec --only firestore --project demo-carcino --config firebase.emulators.json "node --test tests/technicalRules.test.js"
```

O teste inclui autorizações por cliente/administração, revogação, isolamento
entre técnicos, bloqueio de autoaprovação, proteção das notas contra leitura
por cliente/admin/Sênior, validação de campos e bloqueio dos dados de produção.

## Registro independente e mapa administrativo

O botão **Registrar visita e notificar produtor** permite ao técnico informar
nome da propriedade, e-mail do produtor, data, coordenadas, licenciamento e relato
sem autorização prévia. Isso não consulta nem modifica o cadastro do produtor.
O aviso é disponibilizado dentro do site para a conta cujo e-mail foi informado.
O produtor pode aceitar ou contestar. Anotações privadas continuam separadas.

A aba administrativa **Mapa de propriedades** reúne os cadastros com coordenadas
sincronizadas e os registros independentes com coordenadas. Verde indica
licenciamento informado; vermelho, ausência informada; cinza, sem avaliação.
A situação do último relatório é apresentada com seu estado de aceite. A ausência
de informação não é tratada como ausência de licença. Registros de campo sem
correspondência no cadastro aparecem identificados como não vinculados.

O mapa mostra pontos, não limites de imóveis. Dados que ainda estão apenas no
aparelho do cliente só aparecem após acesso ao site atualizado e sincronização.
Os demais técnicos não recebem acesso ao mapa administrativo nem aos registros
de colegas. O proprietário vê as notificações endereçadas à sua conta.

## Identificação profissional obrigatória

Toda conta informa seu nome completo uma vez. O nome é fixado em um registro
imutável separado, que também impede troca por exclusão e recriação do perfil.
Na área técnica, esse nome aparece somente para leitura. O técnico cadastra
foto e tipo de atendimento (particular ou órgão/empresa, com nome da instituição).
O CREA é opcional: vazio, a identificação mostra “Não tem CREA cadastrado”.
A identificação aparece nas autorizações, relatórios e no contato administrativo.
CREA e vínculo são autodeclarados, sem consulta automática ao conselho.

Fotos JPG/PNG/WebP de até 5 MB são decodificadas no navegador, reduzidas para
até 256 pixels no maior lado e salvas como imagem compacta de até 100 KB no
documento de identificação do Firestore. Não é necessário ativar um serviço
adicional de armazenamento. Somente o próprio técnico pode editar a identificação.
Clientes autenticados podem consultar a identificação pelo código, e a listagem
geral é restrita à administração. As regras bloqueiam novos relatórios enquanto
o documento profissional obrigatório não existir.

A foto tem botões explícitos “Anexar foto do técnico” e “Trocar foto do técnico”.
Após selecionar, é necessário salvar a identificação para confirmar a imagem.

## Busca de propriedade sem e-mail

A partir de duas letras do nome, o técnico identificado recebe até oito
sugestões de propriedades. A busca usa um diretório com somente nome e código,
sem expor contato, localização ou dados de produção. Ao escolher uma sugestão,
o aviso fica associado ao UID do produtor: ele recebe e decide no aplicativo,
sem precisar informar e-mail. O e-mail continua opcional para registros sem
cadastro selecionado. Sem vínculo e sem e-mail, o registro fica apenas no
histórico do técnico e na administração, sem notificar uma conta.

O diretório é atualizado na sincronização do cliente. Ao abrir a administração,
cadastros já publicados na projeção compartilhada também são incluídos na busca.
Dados que existem somente em backup/local ou ainda não foram projetados exigem
acesso e sincronização pelo cliente. O aceite de uma notificação não concede
acesso automático aos dados privados da conta.
## Cadastro assistido e auditoria administrativa

Em **Visitas técnicas → Meus atendimentos**, um técnico identificado pode usar **Cadastrar produtor sem acesso ao aplicativo**. Nome completo e e-mail do produtor são opcionais. Sem nome, exige-se um apelido, gravado exclusivamente em `technicalNotebooks/{tecnico}/assistedClients/{cadastro}`; nem administração, outros técnicos ou produtor leem esse apelido.

São obrigatórios celular, nome exclusivo da propriedade, endereço/comunidade, município, UF e declaração de autorização presencial. GPS/coordenadas e referência complementam o endereço. O contato permanece explicitamente não verificado por SMS.

`assistedProducers` preserva autor, data, decisões e versões analisadas em `auditHistory`. Administração/Sênior encontra **Auditoria de cadastros** no portal administrativo. As ações finais são **Aprovar cadastro**, **Recusar cadastro** e **Solicitar ajustes ao técnico**, sempre com justificativa. O técnico corrige os dados solicitados e reenvia a mesma ficha, incrementando a revisão e retornando ao estado pendente; a versão anterior permanece no histórico. Há link de e-mail para contato com o técnico. O autor não pode auditar o próprio cadastro. Uma recusa definitiva permanece preservada.

Em **Usuários e permissões**, administração/Sênior pode conceder **Autorizar suporte técnico e auditar cadastros assistidos** a um usuário dentro de sua hierarquia de gestão. Essa permissão abre **Autorizações e auditoria** na área de visitas e permite analisar pedidos e fichas assistidas, sem dar gestão de usuários ou acesso a notas privadas. Administração e Sênior já têm esse acesso. Revogar a permissão remove a capacidade de analisar novos pedidos no servidor.

`fieldAuthorizations` mantém `active: false` enquanto o pedido está pendente, recusado, revogado ou aguardando ajustes. Somente a auditoria independente pode aprovar; cada envio e decisão gera um evento imutável em `history`. Os pedidos corrigidos voltam à fila pendente. Revogação pelo cliente ou pessoa autorizada é imediata. O aceite de cada relatório pelo produtor continua sendo uma etapa separada da autorização do atendimento.

### Fotos locais e guia da visita

O formulário permanece com os campos atuais, para expansão após entrevistas com técnicos. Fotografias podem ser anexadas durante o preenchimento e ficam em banco IndexedDB separado (`CarcinoGestao-visit-photos-{uid}`), exclusivamente no navegador/aparelho do técnico. Esse banco não entra na sincronização nem no backup de produção. Limite: 8 fotos JPG/PNG/WebP, até 8 MB por arquivo e 40 MB por visita. Fotos de rascunho são associadas ao identificador da visita após seu envio; a guia permite adicionar/remover fotos locais posteriormente.

**Guia da visita e fotos neste aparelho** gera PDF local com dados públicos do relatório e fotos opcionais. O técnico decide se entrega ao cliente. Apelidos privados e anotações do caderno não entram no PDF. A limpeza do navegador pode apagar as fotos, por isso a interface orienta baixar a guia. Nenhuma imagem de visita é enviada ao Firestore, Storage ou serviço de mapas.

Antes de o produtor ativar o acesso, o técnico autor pode registrar atendimentos, coordenadas e avaliações do licenciamento. Depois da ativação, novos atendimentos exigem autorização explícita do cliente ou administração, utilizando `fieldAuthorizations`. Os atendimentos já registrados permanecem no histórico e aguardam decisão individual do cliente. Anotações privadas são separadas em `technicalNotebooks/{tecnico}/assistedVisits` e não são acessíveis ao administrador.

Após aprovação administrativa, o produtor recebe do técnico um código aleatório de 128 bits, válido por 30 dias. Em sua própria conta com e-mail verificado, usa **Receber cadastro feito pelo técnico** na área de visitas. A vinculação consome o código, associa o cadastro à conta e preserva o histórico. O prazo limita o código, não o cadastro; técnico ou administração pode renová-lo antes da vinculação, invalidando o anterior. Não existe login telefônico ou envio de SMS nesta entrega; a autenticação continua por e-mail e senha. O técnico não cria nem armazena senhas do cliente.

O produtor aceita ou contesta os dados e cada atendimento separadamente. Essas decisões não importam dados automaticamente sobre a produção existente e não concedem acesso ao técnico. O cadastro assistido fica acessível como ficha de atendimento vinculada à conta.

## Nomes exclusivos

`propertyNames/{nomeNormalizado}` reserva nomes no servidor. A normalização é idêntica no cliente e nas regras: caixa, acentos portugueses, sinais e espaços não distinguem nomes. Criação assistida e publicação de propriedades usam transações; a disputa simultânea pelo mesmo nome não cria dois cadastros ativos. A reserva acompanha a vinculação do produtor e permite que ele publique sua propriedade com o mesmo nome.

Ao abrir a administração, os nomes de propriedades antigas são reservados e o diretório é atualizado. Conflitos antigos ou falhas de reserva geram aviso administrativo; nenhum registro anterior é apagado ou renomeado automaticamente. Nomes antigos permanecem reservados após renomeação para evitar reutilização acidental. O formulário de identificação em Ajustes também confere a reserva antes de gravar um nome na conta; precisa de conexão para confirmar a exclusividade.

## Ofertas regionais

A autorização para promoções por WhatsApp é opcional, desmarcada inicialmente, específica para ração e produtos da região e não condiciona atendimento. Registra versão do texto, escolha inicial, responsável e horário. O produtor pode alterar a preferência; técnico/suporte podem apenas registrar sua retirada. Alterações exigem evento imutável em `consentHistory`. Nenhum fornecedor recebe acesso aos cadastros e nenhum disparo automático ou serviço de marketing foi implementado.

## Satélite e comparação histórica

O mapa enquadra os pontos antes de solicitar imagens, reutiliza até 96 imagens entre mapas e mostra uma prévia disponível enquanto busca maior resolução. A troca rápida de datas aguarda 180 ms antes de solicitar outra versão, reduzindo requisições descartadas. O tempo final também depende do servidor de imagens.

Os mapas do técnico e da administração oferecem **Baixar KML — Google Earth Pro** e **Baixar Shapefile (.zip)**. O técnico exporta seus registros; a administração exporta os pontos atuais e históricos carregados, respeitando o filtro de licenciamento. Coordenadas WGS84 representam pontos, não limites de propriedades. O ZIP contém SHP, SHX, DBF, PRJ, CPG, instruções e CSV com textos completos (DBF tem limites de tamanho). KML preserva os relatórios completos. Datas, autoria, aceite, auditoria e licenciamento declarado acompanham os registros quando disponíveis. Fotos, apelidos e anotações privadas ficam excluídos. Não há exportação das imagens de satélite.

O mapa compartilhado usa Esri World Imagery por padrão, mantendo OpenStreetMap como alternativa. **Comparar imagens históricas** consulta o catálogo público Esri Wayback sob demanda e oferece barra com as versões disponíveis. As datas indicam publicação do mosaico, não captura da fotografia; versões distintas podem ter a mesma imagem local. A comparação mantém o enquadramento e os marcadores. Falha de imagens/histórico não impede consulta dos relatórios ou troca para ruas. Atribuições dos fornecedores permanecem visíveis.

O satélite atual e histórico permitem ampliação até o nível 22, buscando imagens nativas até o nível 19. Se faltar uma imagem em um trecho, a camada tenta os níveis anteriores e recorta a região correspondente, preservando as coordenadas. A requisição `blankTile=false` evita tratar a imagem de “sem cobertura” como fotografia válida. A interface informa quando está ampliando uma imagem de menor resolução; não há criação artificial de detalhes. Falhas de conexão continuam podendo impedir o carregamento.

O técnico encontra **Mapa e imagens históricas** em **Visitas técnicas → Meus atendimentos**. O botão leva ao mapa e abre a barra histórica. A visão reúne os relatórios de visita e registros de campo autorais com os atendimentos das fichas assistidas cadastradas por ele. Somente visitas efetivamente registradas entram nesse mapa; um cadastro sem atendimento não cria ponto de visita. Consultas ao servidor são limitadas pelo UID do técnico e as regras existentes continuam isolando os registros de colegas. A data histórica altera somente a imagem de fundo: os pontos continuam correspondendo às visitas registradas pelo técnico.
