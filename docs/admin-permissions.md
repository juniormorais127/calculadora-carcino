# Usuários e permissões de serviços

Portal separado: `https://juniormorais127.github.io/calculadora-carcino/admin/`.
Também há um atalho Minha conta → Abrir administração, somente para o dono.
O portal tem entrada HTML/JS própria, sem montar as abas de produção nem
iniciar sincronização dos dados de produção. Mantém Firebase e autenticação
compartilhados com o site no mesmo domínio. Não existe uma caixa postal
`admin@juniormorais127.github.io`: endereço de e-mail próprio exige domínio
e serviço de e-mail. A conta administrativa autorizada permanece a existente.

No portal: Usuários e permissões. Sênior e Administrador podem listar e-mails.
Premium nunca promove alguém a administrador; o cargo é alterado separadamente.

Hierarquia: `senior` tem acesso completo e gerencia os demais cargos, inclusive
administradores. `administrator` altera apenas perfis cujo cargo atual e novo
cargo estejam em Produtor/Técnico de campo; não altera superiores ou a própria
conta administrativa e não concede cargos administrativos. As regras validam o
perfil do solicitante no servidor. O UID principal `Dc2sEKML8Lc66cgj8VvSX4Uhhpk1`
é sempre Sênior e não pode ser rebaixado pelo aplicativo. Outros Sêniores podem
ser concedidos/revogados por Sênior. Apenas Sênior consulta o BI de compras.

Perfil profissional separado da assinatura: `producer` (Produtor) e
`field_technician` (Técnico de campo). Novas contas começam como Produtor.
Só a gestão autorizada altera o perfil; usuários antigos sem esse campo são
tratados como Produtor e podem registrar esse padrão no próximo acesso, sem
alterar Premium ou validade existentes. O painel permite filtrar por perfil.
Ser Técnico de campo não concede Premium nem dados de outros produtores.
Os serviços específicos e a aplicação das restrições serão definidos aos poucos.

Ao entrar ou criar conta no site, o cliente registra `accountProfiles/{uid}`:
e-mail validado contra o token Firebase, primeiro registro no painel, último
acesso registrado, Premium, validade e autor/data da última edição administrativa.
O registro anterior é preservado e apenas e-mail/último acesso são atualizados
no login. Reconexão repete tentativas que não completaram.

Contas anteriores à publicação aparecem após entrar nesta versão. Não existe
endpoint público para listar Firebase Authentication e não se distribui Admin
SDK ou chave de serviço no navegador. Para incluir contas antigas sem novo
login seria necessário importar seus perfis de forma administrativa ou adicionar
um backend de administração. A lista não mostra sessões/acessos em tempo real.

Regras: dono cria exclusivamente perfil gratuito de Produtor (exceto o UID
principal Sênior) e só altera e-mail/último acesso, com migrações restritas de
perfil legado. Gestão autorizada altera cargo/Premium/validade/autor/data. Outros usuários
não consultam esse perfil. Senhas e dados de produção não são expostos.

Validade opcional é fim do dia em Fortaleza. A revogação remove Premium e a
validade. `premiumStatus` respeita expiração mesmo se o booleano permanece true.
O perfil próprio é observado pelo aplicativo para mostrar alterações recebidas.
O editor não cobra, registra pagamentos, verifica recebimentos ou cancela contas.

Nenhum serviço atual foi bloqueado: Premium é uma permissão preparada. Antes
de vender um serviço específico, definir os recursos incluídos e aplicar os
controles correspondentes no backend/regras. Código local de calculadoras e
exportação é distribuído ao navegador; um bloqueio visual isolado não protege
um serviço pago contra manipulação do cliente. Dados/serviços Premium no servidor
precisam verificar a permissão e a validade usando horário do servidor, falhando
fechados quando indisponíveis.

Listagem: 200 perfis por página, com indicação de resultados parciais. Busca
por trecho do e-mail entre perfis carregados, sem cobrança de buscas por tecla.
Para grandes bases, substituir por busca paginada no servidor.
