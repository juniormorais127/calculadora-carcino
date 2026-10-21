# Sincronização automática com prioridade da nuvem

- A nuvem é a referência da conta quando o serviço está acessível. A cópia do aparelho permite abertura rápida e trabalho offline; não é uma segunda base oficial.
- Alterações locais entram na fila e são enviadas automaticamente ao reconectar. Falhas de comunicação preservam essa fila e têm nova tentativa periódica enquanto o aplicativo está aberto.
- O estado compartilhado anterior permite combinar inclusões, exclusões e edições independentes. Para o mesmo campo alterado nos dois lugares, a nuvem prevalece. Exclusão na nuvem não ressuscita um registro antigo.
- Dois cadastros novos com o mesmo identificador numérico são separados, mantendo os vínculos das medições com o viveiro correto.
- Coordenadas conflitantes permanecem como par; itens independentes do checklist são combinados.
- Ao conciliar versões divergentes, a cópia anterior do aparelho fica disponível para download na conta. Sem um estado compartilhado confiável em uma cópia antiga, adota-se a nuvem e preserva-se a cópia local anterior.
- A base resultante e o ponto de sincronização são salvos em uma mesma transação. Os metadados ficam em uma tabela privada, fora dos backups de produção e dos dados enviados à nuvem.
- A migração local da versão 1 para 2 acrescenta apenas essa tabela e preserva os registros existentes. Abas antigas devem ser fechadas e reabertas para usar a atualização.
- Alterações publicadas por outro aparelho chegam por uma assinatura do manifesto do Firestore. Gravações concorrentes usam revisão esperada e repetição limitada, sem bloquear o usuário com escolha de versões.

Fotos e relatórios definidos como locais continuam somente no dispositivo. A sincronização não funciona com o navegador/aplicativo fechado; a fila é retomada ao abrir novamente. Nenhum APK é gerado por esta alteração web.
