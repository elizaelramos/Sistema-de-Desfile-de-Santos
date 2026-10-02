# Sistema de Desfile de Santos

Plataforma web para concursos de caracterização de santos (estilo Holywins): cadastro, fila, locução,
avaliação dos jurados, apuração automática e telão público. Escopo completo em
[escopo-mvp-desfile.md](escopo-mvp-desfile.md).

**Stack:** Next.js 16 (App Router) · TypeScript · Prisma 7 + MariaDB/MySQL · Tailwind 4 · TanStack Query (polling) · `qrcode`.

## Rodando localmente

```bash
npm install
cp .env.example .env            # ajuste DATABASE_URL
npm run db:migrate              # cria as tabelas
npm run organizador -- "Seu Nome" voce@exemplo.com uma-senha-forte --super
npm run ensaio -- voce@exemplo.com   # opcional: evento de ensaio com 30 participantes
npm run dev
```

Criar o banco (uma vez, como root do MariaDB):

```sql
CREATE DATABASE desfile CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'desfile'@'localhost' IDENTIFIED BY 'troque-esta-senha';
GRANT ALL ON desfile.* TO 'desfile'@'localhost';
```

## Como funciona

| Rota | Quem usa |
|---|---|
| `/login`, `/painel` | Coordenador (e-mail + senha) — cria e gerencia os próprios desfiles |
| `/painel/usuarios` | Super admin — cria, edita e desativa coordenadores e outros super admins |
| `/a/<token>` | Cada Cadastrador, Fila, Locutor e cada Jurado — link do QR Code + nome |
| `/p/<slug>` | Telão / público (sem login) |

- **Painel do evento** — abas *Andamento* (abrir/fechar/revelar categorias, jurados pendentes, liberação manual),
  *Configuração* (dados, regras, quesitos, categorias, duplicar, encerrar), *QR Codes* (imprimir, ver quem está
  conectado, regenerar) e *Resultados* (ranking completo com médias por quesito e critério de desempate).
- **Trava de avaliação** — a fila só libera o próximo participante quando todos os jurados confirmaram as notas do
  atual. Se um jurado ficar impedido, o organizador libera manualmente informando o motivo (fica registrado em
  *Ocorrências*; a média usa só as notas existentes).
- **Apuração** — ao fechar a categoria: média de todas as notas; desempate pela média do 1º quesito, 2º, …; depois
  idade (configurável); por último sorteio automático registrado com data e hora. Ausentes que não desfilaram ficam
  fora. Lógica em [src/lib/apuracao.ts](src/lib/apuracao.ts).
- **Telão** — mostra o participante atual (sem notas) e, após *Revelar resultado*, o pódio da categoria até o
  próximo participante ser liberado. A API pública tem cache de 2 s em memória, e o Nginx pode fazer micro-cache.
- **QR Codes** — token aleatório de 256 bits por função e por jurado. Regenerar invalida o anterior; encerrar o
  evento desativa todos.

Estrutura principal:

```
prisma/schema.prisma        modelo de dados
src/lib/desfile.ts          regras do dia: cadastro, fila, trava, abrir/fechar/revelar, notas
src/lib/eventos.ts          configuração: criar, duplicar, jurados, categorias, quesitos, QR
src/lib/paineis.ts          dados de cada tela (fila, locutor, jurado, público)
src/app/api/                rotas: org/ (organizador), r/[token]/ (funções), publico/
src/components/             telas (organizador/, funcoes/, telao)
scripts/                    criar organizador, evento de ensaio
deploy/                     Nginx, backup
```

## Deploy (VPS Hostinger)

```bash
git clone … && cd sistema-desfile
cp .env.example .env   # DATABASE_URL, APP_URL=https://desfile.seudominio…
npm ci && npm run db:migrate && npm run build
pm2 start ecosystem.config.cjs && pm2 save
sudo cp deploy/nginx-desfile.conf /etc/nginx/sites-available/desfile   # ajuste o domínio
sudo ln -s /etc/nginx/sites-available/desfile /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d desfile.seudominio.com.br
```

Atualizar: `git pull && npm ci && npm run db:migrate && npm run build && pm2 restart desfile`.

Backup antes e depois de cada evento: `deploy/backup.sh`.
