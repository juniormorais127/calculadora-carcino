# Usuários e permissões de serviços

Minha conta → Painel administrativo → Usuários e permissões. Apenas o UID
administrativo já configurado pode listar e-mails e editar Premium. Uma permissão
Premium nunca promove alguém a administrador.

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

Regras: dono cria exclusivamente perfil gratuito e só altera e-mail/último
acesso; administrador altera somente Premium/validade/autor/data. Outros usuários
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
