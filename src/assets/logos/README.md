# Logomarcas

Arquivos oficiais, preservados sem redesenho, obtidos em 2026-10-15:

- ADM: https://www.admnutricaoanimal.com.br/wp-content/uploads/2023/07/adm-logo-header-large.png
- Guabi Aqua: https://www.guabiaqua.com.br/imagens/logo_guabi.png

Os arquivos importados pelo Vite entram no bundle e no cache offline.
Para adicionar uma logomarca de fabricante ou revenda, importe o arquivo em
`src/data/fabricantesRacao.js` e informe `logo` no cadastro correspondente.
Use `logoFundoEscuro: true` para imagens com lettering branco.

AquaNutri e revendas locais ainda não têm arquivos de identidade confirmados.
O componente mostra uma identificação textual explícita nesses casos; ela não
representa uma logomarca oficial. Não usar a logo do fabricante como se fosse
a identidade da revenda.
