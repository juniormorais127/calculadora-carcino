# Aplicativo Android de testes

O APK usa Capacitor e inclui os arquivos do sistema dentro do aplicativo, sem depender de carregar o site para abrir. O identificador é `br.com.carcinogestao.app`. O primeiro login, a verificação de e-mail, as consultas remotas, a auditoria e o envio de visitas exigem internet. A produção já recuperada permanece na base local por conta. O perfil previamente consultado pode ser usado para abrir a área local offline; as regras do servidor continuam decidindo qualquer operação remota.

## Fotos e relatórios

Fotos de visita ficam no diretório privado Data do aplicativo, com índice separado por UID no IndexedDB. Não vão ao Firebase, ao backup de produção nem para outra conta. Até 8 fotos, 8 MB cada e 40 MB por visita. A gravação conclui os arquivos antes de trocar o índice; falha preserva as fotos anteriores. No navegador, mantém-se o armazenamento local existente. Fotos do perfil profissional continuam seguindo o cadastro compartilhado existente, separadas das fotos das visitas.

Em **Visitas técnicas → Relatórios locais de campo**, o técnico pode criar um relatório sem conexão, preencher propriedade, endereço, data, testes e GPS, salvar, reabrir e incluir fotos. O caderno não registra aceite, não cria autorizações e não substitui o envio da visita ao sistema. Use **Salvar relatório neste aparelho** antes de sair. A guia PDF inclui as fotos locais quando selecionadas. O PDF é gerado no aparelho, salvo em `Documents/CarcinoGestao` e abre a folha de compartilhamento do Android. KML, Shapefile e backups de produção usam a mesma integração de arquivos.

Desinstalar o aplicativo, limpar seus dados, perder ou trocar o celular pode apagar o caderno e as fotos. Guarde cópias dos PDFs fora do aplicativo. As imagens anexadas anteriormente pelo navegador não são transferidas automaticamente para o APK. Mapas e imagens de satélite precisam de conexão.

## Compilação e teste

Requisitos locais: Node 22+, Java 21 e Android SDK 36. `npm ci`, `npm run android:sync`, depois `android/gradlew assembleDebug` (Windows: `npm run android:apk`). A interface utiliza recursos locais, não um `server.url` remoto. Não registrar service worker no runtime nativo. GPS usa permissão solicitada em contexto; arquivos não exigem acesso amplo ao armazenamento.

O workflow **APK Android de testes** compila, disponibiliza `CarcinoGestao-teste.apk` e SHA256, instala no emulador e verifica abertura, arquivo fotográfico nativo, isolamento por conta, PDF e persistência após reiniciar sem rede. O diagnóstico usa apenas registros sintéticos e só entra nos builds com `VITE_ANDROID_TEST=true`. Evidências e APK são artefatos do workflow. O APK é de depuração e não deve ser publicado na Play Store.

A chave `carcino-test.keystore`, quando presente no repositório, é pública, exclusivamente para testes e serve para atualizar versões de teste sem desinstalar. Nunca usar como assinatura de produção. A versão definitiva exige chave de produção privada, política de privacidade e validação em aparelhos reais. Não garantir compatibilidade com todos os fabricantes apenas pelo emulador.
