# Visitas técnicas

O cliente abre **Minha conta → Visitas técnicas e autorizações**. Técnicos de
campo têm a seção **Meus atendimentos**, onde encontram seu código de conta.
Esse código pode ser autorizado pelo cliente ou pela administração. A
administração também dispõe da aba **Visitas e licenciamento**, com o e-mail
do cliente e o código do técnico para criar a autorização.

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
Leaflet e mosaicos do OpenStreetMap, com atribuição, carregados apenas quando
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
