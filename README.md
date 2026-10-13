# CarcinoGestão

> 🚀 **Acesse o site online funcionando agora:**  
> 👉 **[https://juniormorais127.github.io/calculadora-carcino/](https://juniormorais127.github.io/calculadora-carcino/)**

Site gratuito para produtores de camarão, com interface adaptada a celulares, tablets e computadores. React, Tailwind CSS e IndexedDB (Dexie).

## Recursos

- Cadastro de viveiros, biometrias e qualidade da água.
- Calculadoras de manejo e guia de sanidade.
- Checklist de biossegurança incluído no backup.
- Dados armazenados no navegador do próprio produtor, sem login, servidor de registros ou sincronização entre dispositivos.
- Acesso offline após o primeiro carregamento completo da versão publicada.
- Exportação e restauração por arquivos JSON.

Novos usuários começam sem dados de demonstração. Os exemplos podem ser carregados em **Ajustes**. Faça backups regularmente: limpar os dados do navegador, trocar de aparelho ou usar outro navegador não transfere os registros. O guia e as estimativas auxiliam o acompanhamento e não substituem a avaliação técnica de campo.

## Desenvolvimento

Requer Node.js 22 e npm.

```sh
npm ci
npm run dev
```

## Verificação

```sh
npm test
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
```

Os testes verificam larguras de 320 a 1440 px, navegação, formulários, uso por teclado, persistência, backup e recarga offline. O teste offline usa a compilação de produção, servida automaticamente na porta 4175.

## Publicação

O workflow em `.github/workflows/pages.yml` testa e publica no GitHub Pages a cada atualização de `main`. Habilite **GitHub Actions** como origem do Pages nas configurações do repositório.

`VITE_BASE_PATH` define o caminho da hospedagem; o padrão é `/`. O workflow usa `/calculadora-carcino/`.
