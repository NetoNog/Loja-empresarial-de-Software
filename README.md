# Loja de Software

Loja interna (no estilo Microsoft Store) para distribuir os aplicativos da equipe de Desenvolvimento de Soluções.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Prisma (SQLite por padrão) · [Astryx Design System](https://github.com/meta/astryx) (tema `neutral`) + Tailwind v4

## Funcionalidades

| Área | O que faz |
|---|---|
| **Início** | Carrossel de destaques, categorias, novidades, ranking de mais baixados e últimas notícias |
| **Aplicativos** | Busca, filtro por categoria, ordenação e paginação |
| **Página do app** | Ícone, capturas de tela, descrição em Markdown, notas da versão, histórico de versões, download por plataforma, SHA-256, instalação remota via ITAM (opcional) |
| **Atualizações** | Linha do tempo das versões publicadas, com notas de lançamento |
| **Notícias** | Comunicados e lançamentos, opcionalmente vinculados a um app |
| **Biblioteca** | Apps que o usuário baixou, com aviso de "atualização disponível" |
| **Admin** | Aplicativos (CRUD, ícone, banner, capturas, versões com upload em streaming e barra de progresso), categorias, notícias, painel com métricas |
| **Admin Master** | Tudo do Admin + usuários e permissões (promover/rebaixar Admin, desativar contas, redefinir senha) + auditoria |

### Acesso

Todo o sistema exige login: ao abrir o site o usuário cai em `/login` e, após autenticar, volta para a página que tentou acessar (ou para o Início). Apenas `/login`, `/registro` e `/api/health` são públicos. A ilustração da tela de login fica em `public/login-illustration.svg` e pode ser trocada por outra imagem.

### Papéis

- **Usuário**: navega e baixa.
- **Administrador**: gerencia aplicativos, versões, mídia, categorias e notícias.
- **Admin Master**: tudo acima + concede/revoga o papel de Administrador e consulta a auditoria. O sistema impede remover o último Admin Master.

## Rodando localmente

```bash
npm install
cp .env.example .env          # preencha AUTH_SECRET, MASTER_EMAIL e MASTER_PASSWORD
npx prisma migrate deploy     # cria o banco
npm run db:seed               # cria o Admin Master e categorias iniciais
npm run dev
```

Acesse http://localhost:3000 e entre com o e-mail/senha do Admin Master.

## Produção

1. `npm ci && npm run build`
2. `npx prisma migrate deploy && npm run db:seed` (o seed é idempotente)
3. `npm start` (ou `node .next/standalone/server.js` copiando `.next/static` e `public` para dentro de `.next/standalone`)

Checklist:

- [ ] `AUTH_SECRET` aleatório com 32+ caracteres (o app não sobe em produção sem ele)
- [ ] HTTPS no proxy reverso (IIS/Nginx) e `COOKIE_SECURE=true`
- [ ] Proxy sobrescrevendo `X-Forwarded-For` e `TRUST_PROXY=true`
- [ ] Limite de upload do proxy ≥ `MAX_UPLOAD_MB` (ex.: Nginx `client_max_body_size 2048m;` / IIS `maxAllowedContentLength`) e timeout longo para `/api/admin/upload`
- [ ] `DATABASE_URL` e `STORAGE_DIR` apontando para um volume persistente, **com backup** (banco + pasta de arquivos)
- [ ] Trocar a senha do Admin Master no primeiro acesso (Minha conta)
- [ ] `ALLOWED_EMAIL_DOMAIN` definido, se o cadastro aberto ficar ligado
- [ ] Monitoramento em `GET /api/health`

Com Docker: `docker build -t loja-software .` e monte volumes em `/data` (veja o `Dockerfile`).

### MySQL em vez de SQLite

Em `prisma/schema.prisma`, troque `provider = "sqlite"` por `"mysql"`, adicione `@db.Text` em `description`, `changelog`, `body` e `details`, ajuste `DATABASE_URL` e gere uma nova migração (`npx prisma migrate dev --name mysql`).

## Instalação remota (ITOM/ITAM)

O comportamento da versão anterior (disparar o job `PostSWJob` no ITAM para a máquina do usuário) foi mantido como recurso opcional:

1. `ITOM_ENABLED=true` e variáveis `ITOM_*` no `.env`
2. No cadastro do app, preencha **ID do pacote no ITAM**
3. Na página do app aparece **Instalar no meu computador**: o usuário escolhe uma das máquinas associadas ao seu IP no inventário

## Segurança

- Sessão JWT (HS256) em cookie `httpOnly`, revalidada no banco a cada requisição (mudança de papel e desativação valem na hora)
- Autorização no servidor em toda página, Server Action e rota (o middleware é só a primeira barreira)
- Senhas com bcrypt (custo 12), limite de tentativas de login, mensagens que não revelam se o e-mail existe
- Uploads: extensão em lista permitida, limite de tamanho, SHA-256 calculado no servidor, imagens validadas pela assinatura binária (SVG recusado), proteção contra path traversal
- CSRF: Server Actions validam a origem; rotas de upload e instalação exigem `Origin` igual ao host
- Consultas parametrizadas (inclusive na integração ITOM) e XML escapado no SOAP
- Auditoria de login, alterações no catálogo, permissões e instalações remotas

## Estrutura

```
app/(store)/          vitrine + admin (dentro do AppShell)
app/(auth)/           login e cadastro
app/actions/          Server Actions (auth, apps, notícias, usuários)
app/api/              download, mídia, upload em streaming, instalação remota, health
components/           UI (Astryx) — forms/, admin/, store/, ui/
lib/                  sessão, dados, storage, ITOM, validação, auditoria
prisma/               schema, migrações e seed
storage/              arquivos enviados (fora do git)
```

## Design system

A interface usa os componentes do Astryx (`@astryxdesign/core`) partindo dos templates oficiais (`shell-side-nav`, `product-detail`, `product-gallery`, `login-card`, `table-page`). Consulte a documentação com `npx astryx docs` e `npx astryx component <Nome>`. Para trocar o tema: `npx astryx theme list` e `npx astryx theme add <slug>`.
