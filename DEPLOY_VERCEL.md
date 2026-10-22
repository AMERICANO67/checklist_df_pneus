# Deploy na Vercel com envio de e-mail

## 1. Suba o projeto

- importe esta pasta na Vercel
- o arquivo `vercel.json` já aponta a raiz para `checklist_df_pneus.html`

## 2. Configure as variáveis de ambiente

Use estas variáveis na Vercel:

- `RESEND_API_KEY`
- `CHECKLIST_FROM_EMAIL`
- `CHECKLIST_FROM_NAME`
- `CHECKLIST_REPLY_TO`

Referência local: [`.env.example`](file:///c:/Users/Fernando/Desktop/checklist_df_pneus/.env.example)

## 3. Provedor de e-mail

Este projeto usa a API da Resend na função:

- [`api/send-checklist-email.js`](file:///c:/Users/Fernando/Desktop/checklist_df_pneus/api/send-checklist-email.js)

O domínio do e-mail remetente precisa estar validado na Resend para produção.

## 4. Como funciona

- em produção, o botão `Enviar e-mail` tenta primeiro `/api/send-checklist-email`
- se a API estiver configurada, o e-mail segue com o PDF anexado
- se a API não estiver disponível, o sistema cai no fallback local com `mailto`
