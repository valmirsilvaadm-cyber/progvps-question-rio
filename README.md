# prog.vps — Formulário de Briefing / Qualificação de Leads

Aplicativo web completo (frontend + backend) para qualificar clientes antes do
primeiro contato comercial: questionário estilo "assistente virtual", geração
automática de orçamento em PDF, envio por e-mail para a equipe e painel
administrativo com leads, gráficos e perguntas personalizáveis.

## Estrutura do projeto

```
progvps-app/
├── frontend/     React + Vite + Tailwind (o que o cliente vê)
└── backend/      Node.js + Express (salva leads e envia e-mail)
```

---

## 1. Backend (API + envio de e-mail)

```bash
cd backend
npm install
cp .env.example .env
```

Abra o arquivo `.env` e preencha:

```
SMTP_USER=seu-email-remetente@gmail.com
SMTP_PASS=sua-senha-de-app-de-16-digitos
TO_EMAIL=prog.vps@gmail.com
PORT=4000
```

### Como gerar a senha de app do Gmail
O Gmail não aceita mais a senha normal da conta para envio via SMTP. Você
precisa:
1. Ativar a **verificação em duas etapas** na conta Google que vai enviar os e-mails.
2. Acessar https://myaccount.google.com/apppasswords
3. Gerar uma senha de app (16 dígitos) e colar em `SMTP_PASS`.
4. `SMTP_USER` deve ser o e-mail dessa mesma conta (pode ser uma conta diferente de `prog.vps@gmail.com`, que é só o destino).

Depois, rode o servidor:

```bash
npm run dev
```

Ele sobe em `http://localhost:4000`. Teste abrindo essa URL no navegador — deve
aparecer "API prog.vps rodando".

---

## 2. Frontend (o formulário em si)

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abre em `http://localhost:5173`. O arquivo `.env` do frontend aponta para o
backend (`VITE_API_URL`) — ajuste se o backend estiver em outra URL/porta.

---

## O que já funciona de verdade

- Formulário completo (17 perguntas + as que o admin adicionar), com validação, máscara de WhatsApp e barra de progresso
- Ao enviar: gera um PDF real do orçamento (biblioteca `jsPDF`) e envia por e-mail para `prog.vps@gmail.com` via Gmail SMTP
- Lead salvo em `backend/data/leads.json` (arquivo local — veja seção de banco de dados abaixo)
- Painel administrativo: busca, gráfico de tipos de app, status do lead (persistido no backend), exportação CSV, download do PDF de qualquer lead
- Admin pode cadastrar novas perguntas (texto curto, texto longo, múltipla escolha), salvas em `backend/data/questions.json` e exibidas automaticamente no formulário

## Limitações desta versão / próximos passos recomendados

- **Armazenamento em arquivo JSON**: funciona bem para começar e para poucos leads, mas não é seguro para produção com muitos acessos simultâneos. Para crescer, troque `backend/data/*.json` por um banco de dados real — Postgres, MongoDB, Supabase ou Firebase Firestore são boas opções e a troca fica isolada no `server.js`.
- **Autenticação do painel admin**: hoje o painel é acessível por qualquer pessoa que abra o app. Antes de publicar, adicione login (ex: uma tela de senha simples, ou algo como NextAuth/Clerk/Auth0) protegendo a rota do painel e os endpoints `/api/leads` e `/api/questions` no backend.
- **E-mail apenas para a equipe**: hoje o e-mail com o PDF vai só para `TO_EMAIL` (prog.vps@gmail.com). Se quiser também confirmar por e-mail para o próprio cliente, dá pra duplicar o envio em `server.js` usando `answers.email` como destinatário adicional.
- **WhatsApp**: troque `WHATSAPP_NUMBER` em `frontend/src/App.jsx` pelo número real da empresa (formato: código do país + DDD + número, sem espaços nem símbolos).

## Publicar em produção (sugestão simples)

- **Frontend**: publique a pasta `frontend` na Vercel ou Netlify (`npm run build` gera a pasta `dist`). Configure a variável de ambiente `VITE_API_URL` apontando para a URL pública do backend.
- **Backend**: publique a pasta `backend` no Render, Railway ou um VPS próprio. Configure as mesmas variáveis do `.env` no painel do serviço escolhido.
- Se preferir tudo em um único serviço, o Express pode servir os arquivos estáticos do build do frontend (`app.use(express.static(...))`) — posso te ajudar a configurar isso quando for a hora do deploy.
