# Painel de interesse em compras

Acesso: Minha conta → Painel administrativo. Restrito ao UID administrativo
`Dc2sEKML8Lc66cgj8VvSX4Uhhpk1`, também validado pelas regras Firestore.
Trocar o administrador exige atualizar `purchaseMetrics.js` e `firestore.rules`.
Nenhuma permissão administrativa aos dados de produção foi acrescentada.

Eventos medidos a partir da publicação: abertura de Onde Comprar (`view`), filtro
de fabricante (`brand`), clique no WhatsApp (`whatsapp`) e telefone (`phone`).
O formato admite `product` para futuros botões de produtos. O catálogo atual
lista vendedores com vários produtos; contato não é atribuído a um item específico.

`purchaseEvents/{id}` contém UID, ação, destino, categoria, horário do clique e
horário de recebimento. Não contém e-mail, telefone do produtor ou registros da
fazenda. O navegador mantém uma fila Dexie por UID para reenvio quando online,
ao voltar à janela e a cada 30 segundos. IDs estáveis e consulta antes do reenvio
evitam duplicatas de uploads cujo retorno se perdeu. Navegador fechado ou dados
locais apagados antes da sincronização podem perder eventos ainda na fila.

Usuários autenticados criam somente eventos próprios, consultam documentos
próprios por ID e podem apagá-los; não listam eventos. Somente o administrador
lista os eventos gerais. Eventos são sinais enviados pelo cliente, não auditoria
de transações: usuários podem repetir/fabricar cliques; não usar para comprovar
vendas nem cobrar comissões automaticamente. Não há rastreamento de identidade
entre contas, dispositivos desconectados ou pessoas que compartilham um login.

Datas usam Fortaleza (UTC−3), incluindo o dia final inteiro. Cada página tem
1000 eventos; a interface sinaliza relatório parcial e oferece carregar mais.
Contas distintas são calculadas após filtros; não somar únicos de várias linhas.
CSV contém agregados por destino, sem UID. Leituras e gravações usam as cotas
Firestore existentes do plano Spark; nenhum serviço pago foi ativado. Grandes
volumes exigirão agregações no servidor para evitar ler eventos individualmente.

Verificação: testes unitários de contagem/período/admin, teste de UI com dados
sintéticos (mobile/desktop/CSV/filtros), e teste opt-in Firebase que cria contas
temporárias para validar upload, fila offline e negação de leituras gerais.
