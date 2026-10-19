# Aplicativo Android de testes

## Download e avisos de atualização

Em **Ajustes → Aplicativo Android**, tanto o site quanto o APK oferecem o download e o caminho de instalação: Arquivos → Downloads → CarcinoGestao-teste.apk → Atualizar. O site permanece utilizável pelo navegador, sem instalação obrigatória. Somente o Android nativo consulta `App.getInfo()` e exibe o aviso se o `versionCode` publicado for maior que a compilação instalada. Versão igual, compilação mais recente no aparelho e navegador não recebem o aviso. A verificação acontece na abertura, retorno ao aplicativo, foco/conexão e a cada seis horas em primeiro plano; eventos próximos são agrupados por 60 segundos. Não há push, instalação automática nem bloqueio do uso offline. Erros de conexão não geram falso aviso de atualização.

O catálogo público é `public/android-release.json`, consultado por HTTPS com `cache: no-store`. URLs aceitas são exclusivamente APKs do repositório oficial. A publicação Android gera códigos crescentes (`1000 + GITHUB_RUN_NUMBER`), conserva a assinatura, valida no emulador, publica uma release e só então atualiza o catálogo após conferir que o APK pode ser baixado publicamente. Um segundo deploy do Pages disponibiliza o catálogo atualizado. Builds antigos não sobrescrevem uma compilação mais nova já publicada; somente builds do branch master são anunciados.

APKs anteriores à implementação do verificador precisam de uma primeira atualização manual para passar a receber os avisos futuros. O aviso orienta instalar por cima, sem desinstalar nem limpar os dados, preservando o armazenamento local. Não remover os assets de releases antigas enquanto usuários puderem precisar deles.

Na versão 1.0.1-teste (versionCode 2), o link de administração aponta explicitamente para `admin/index.html`. O servidor local do Capacitor trata `/admin/` como rota de SPA e devolve a entrada principal, por isso o caminho com nome do arquivo é necessário no APK. O teste Android verifica a navegação pelo botão real, manutenção da origem, retorno ao aplicativo e controles visuais de administrador/sênior com dados sintéticos, sem mudar permissões de contas reais. As regras do servidor continuam protegendo os dados administrativos.

O APK usa Capacitor e inclui os arquivos do sistema dentro do aplicativo, sem depender de carregar o site para abrir. O identificador é `br.com.carcinogestao.app`. O primeiro login, a verificação de e-mail, as consultas remotas, a auditoria e o envio de visitas exigem internet. A produção já recuperada permanece na base local por conta. O perfil previamente consultado pode ser usado para abrir a área local offline; as regras do servidor continuam decidindo qualquer operação remota.

## Fotos e relatórios

Fotos de visita ficam no diretório privado Data do aplicativo, com índice separado por UID no IndexedDB. Não vão ao Firebase, ao backup de produção nem para outra conta. Até 8 fotos, 8 MB cada e 40 MB por visita. A gravação conclui os arquivos antes de trocar o índice; falha preserva as fotos anteriores. No navegador, mantém-se o armazenamento local existente. Fotos do perfil profissional continuam seguindo o cadastro compartilhado existente, separadas das fotos das visitas.

Em **Visitas técnicas → Relatórios locais de campo**, o técnico pode criar um relatório sem conexão, preencher propriedade, endereço, data, testes e GPS, salvar, reabrir e incluir fotos. O caderno não registra aceite, não cria autorizações e não substitui o envio da visita ao sistema. O texto salva automaticamente após uma pausa de 500 ms e também pode ser salvo pelo botão **Salvar relatório neste aparelho**. Produtores encontram o mesmo caderno na aba **Conta**. A guia PDF inclui as fotos locais quando selecionadas. O PDF é gerado no aparelho, salvo em `Documents/CarcinoGestao` e abre a folha de compartilhamento do Android. KML, Shapefile e backups de produção usam a mesma integração de arquivos.

Desinstalar o aplicativo, limpar seus dados, perder ou trocar o celular pode apagar o caderno e as fotos. Guarde cópias dos PDFs fora do aplicativo. As imagens anexadas anteriormente pelo navegador não são transferidas automaticamente para o APK. Mapas e imagens de satélite precisam de conexão.

## Compilação e teste

Requisitos locais: Node 22+, Java 21 e Android SDK 36. `npm ci`, `npm run android:sync`, depois `android/gradlew assembleDebug` (Windows: `npm run android:apk`). A interface utiliza recursos locais, não um `server.url` remoto. Não registrar service worker no runtime nativo. GPS usa permissão solicitada em contexto; arquivos não exigem acesso amplo ao armazenamento.

O workflow **APK Android de testes** compila, disponibiliza `CarcinoGestao-teste.apk` e SHA256, instala no emulador e verifica abertura, arquivo fotográfico nativo, isolamento por conta, PDF, GPS, compartilhamento nativo e persistência após reiniciar sem rede. O diagnóstico usa apenas registros sintéticos e só entra nos builds com `VITE_ANDROID_TEST=true`. Evidências e APK são artefatos do workflow. O APK é de depuração e não deve ser publicado na Play Store.

A assinatura de testes usa uma chave preservada no secret `ANDROID_TEST_KEYSTORE_BASE64` do GitHub, sem incluir a chave no código ou no APK. Isso permite atualizar versões de teste sem desinstalar. A cópia local é ignorada pelo Git. Nunca usar como assinatura de produção. A versão definitiva exige chave de produção privada, política de privacidade e validação em aparelhos reais. Não garantir compatibilidade com todos os fabricantes apenas pelo emulador.
