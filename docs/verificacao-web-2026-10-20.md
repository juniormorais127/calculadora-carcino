# Verificação da versão web — 20/10/2026

Revisão com dados sintéticos em bancos locais separados, sem alterar registros reais de clientes. Não foi gerado APK.

## Cobertura

| Área | Fluxos verificados |
| --- | --- |
| Entrada | Login, cadastro, confirmação de conta, recuperação de senha e sessão sem resposta |
| Produção | Painel, primeiro cadastro, criação/edição de viveiro, GPS e coordenadas manuais |
| Biometria | Cadastro, dados antigos, exclusão da primeira/intermediária/última pesagem, reabertura e erro de gravação |
| Água | Cadastro, alertas, metais, exclusão de medições e isolamento entre viveiros |
| Calculadoras | Navegação entre calculadoras, biorremediação e seleção da última medição do dia |
| Sanidade | Doenças, fotos, checklist, persistência por conta e inclusão no backup |
| Compras e ajustes | Navegação, métricas, permissões, backup e informações de versão |
| Técnico | Tópicos, cadastro assistido, visitas, aceite do produtor, auditoria, perfil, ensaios e licenciamento |
| Administração | Todas as seções, hierarquia de permissões, usuários, compras, auditorias e mapas |
| Mapas | Marcadores, licenciamento, histórico, medição, polígonos, zoom e exportação |
| Documentos e fotos | Relatório local, reabertura com fotos e geração de PDF sem enviar imagens ao servidor |
| Interface | Chromium, Firefox e WebKit; larguras de 320 a 1440 px, incluindo celular em paisagem |

## Falhas corrigidas

- Peso antigo armazenado como texto podia lançar erro ao abrir o formulário de biometria.
- Viveiro sem área podia lançar erro no painel e na lista de viveiros.
- Ganhos de peso ficavam desatualizados após excluir uma pesagem ou cadastrar uma data anterior.
- Calculadoras podiam usar a primeira medição quando havia várias no mesmo dia; valores automáticos não acompanhavam alterações recebidas no mesmo viveiro.
- Checklist era gravado no banco geral do navegador, fora do banco da conta.
- WebKit podia rejeitar Blob/File no IndexedDB. Fotos web passam a ser guardadas como bytes locais, mantendo leitura de registros antigos.
- Seleção de propriedade podia ser perdida no WebKit quando o campo perdia o foco antes do clique.
- Falhas de gravação/exclusão de viveiros e medições não ofereciam retorno suficiente ao usuário.
- Verificação de link de recuperação não tinha limite de espera.
- Erros de renderização não tinham proteção por tela; agora exibem recuperação e preservam a navegação disponível.

## Resultado e limites

- 190 testes de lógica/armazenamento aprovados.
- 145 execuções de cenários de interface aprovadas nos três motores, contabilizando a bateria completa e a repetição dos cenários corrigidos. As primeiras rodadas encontraram falhas; os cenários afetados foram repetidos após as correções.
- 9 execuções de integração com o Firebase real permaneceram desativadas, pois criam contas descartáveis no projeto real. Os testes de interface usam sessões e respostas sintéticas; não validam entrega de e-mail/SMS.
- 2 execuções do service worker foram omitidas em Firefox/WebKit; a reabertura offline da entrada de produção foi verificada em Chromium.
- A revisão cobre os fluxos descritos, não todas as combinações possíveis de dados/aparelhos, disponibilidade de fornecedores de mapas ou uma nova versão nativa.

Comandos: `npm test`, `npm run build` e `npx playwright test --workers 3`. O workflow `web-validation.yml` repete a verificação de interface em Chromium nas próximas alterações; o workflow de regras continua validando o Firestore com emulador.

O aviso “EM MANUTENÇÃO” está nas três entradas HTML, fora do React, para aparecer mesmo se a inicialização do aplicativo falhar.
