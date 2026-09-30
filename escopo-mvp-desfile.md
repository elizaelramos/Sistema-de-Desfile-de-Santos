# Sistema de Desfile de Santos — Escopo do MVP

> Plataforma web para gerenciar concursos de caracterização de santos (desfiles no estilo Holywins): cadastro, fila, locução, avaliação dos jurados, apuração automática e telão público.
> Primeiro uso: **Holywins Corumbá — 01/11/2026**. Possível uso anterior: evento de outra comunidade em 31/10/2026.

---

## 1. Decisão de arquitetura

**Aplicação separada do portal do Holywins**, em subdomínio próprio (ex.: `desfile.seudominio`).

Motivos:
- **Vários organizadores:** o sistema atende outros eventos da cidade, com identidade neutra, sem depender do portal do Holywins.
- **Isolamento:** uma atualização no portal não derruba o desfile no dia do evento, e o contrário também vale.
- **Deploy independente:** dá para corrigir o sistema na véspera sem mexer no site.

Mesma VPS (Hostinger), mas processo e banco de dados próprios.

---

## 2. Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Banco | MySQL/MariaDB, banco dedicado `desfile` |
| ORM | Prisma |
| Interface | Tailwind CSS, mobile-first |
| Sincronização | Polling com TanStack Query (2–3 s nas funções internas, 5 s na página pública com cache) |
| QR Code | biblioteca `qrcode` (geração no servidor) |
| Autenticação | Organizador: e-mail + senha (bcrypt) com sessão em cookie. Demais funções: token do QR Code + nome |
| Deploy | PM2 + Nginx (proxy reverso) + Certbot (HTTPS) |

Sem WebSocket no MVP: o volume é pequeno e o polling é suficiente e mais simples.

---

## 3. Funções

| Função | Acesso | O que faz |
|---|---|---|
| **Organizador** | Login e senha | Configura o evento, gera QR Codes, abre e fecha categorias, revela resultados, acompanha tudo |
| **Cadastro** | QR Code + nome | Registra participantes |
| **Fila** | QR Code + nome | Organiza a fila, marca presença e libera cada participante para desfilar |
| **Locutor** | QR Code + nome | Vê o participante atual e o próximo (somente leitura) |
| **Jurado** | QR Code **individual** + nome | Dá as notas de cada participante |
| **Telão** | Link ou QR público | Mostra o desfile e o pódio, na TV ou no celular do público |

Regras de acesso:
- Um QR Code por função; **um QR Code por jurado** (Jurado 1, 2, 3…).
- O jurado que trocar de aparelho escaneia o mesmo QR e continua com as próprias notas (plano B).
- O organizador vê quem está conectado em cada função e pode **regenerar** um QR Code, o que invalida o anterior.
- Os QR Codes expiram quando o evento é encerrado.

---

## 4. Configuração do evento (Organizador)

- **Dados do evento:** nome, data, local.
- **Categorias:** nome, idade mínima e máxima, ordem de desfile. Modelo padrão:

  | Categoria | Faixa |
  |---|---|
  | Baby | até 5 anos |
  | Infanto-juvenil | 6 a 12 |
  | Jovem | 13 a 29 |
  | Adulto | 30 a 59 |
  | 60+ | 60 ou mais |

- **Quesitos:** nome e ordem. **O 1º é o mais importante** e é o primeiro critério de desempate.
- **Número de jurados:** definido pelo organizador.
- **Desempate por idade:** vence o **mais velho** ou o **mais novo**.
- **Página pública:** exibir nome completo ou **só o primeiro nome**.
- **Duplicar evento:** copia categorias, quesitos e regras para um novo evento.

---

## 5. Fluxo do dia e telas

### 5.1 Cadastro
- Campos: **número do adesivo**, **nome**, **idade**, **santo representado**.
- A categoria é definida **automaticamente** pela idade.
- O número é único no evento. O sistema sugere o próximo disponível, mas aceita o número do adesivo que foi colado.
- Busca rápida para corrigir um cadastro.
- Quem se cadastra com a categoria já em andamento entra **no fim da fila** dessa categoria.

### 5.2 Fila
- Lista da categoria atual em **ordem numérica crescente**.
- Ações por participante: **Presente**, **Ausente**, **Liberar para desfile**.
- **Ausente** vai para o fim da fila. Se não desfilar até o fechamento, fica **fora da apuração**.
- Ao liberar, as telas de locutor, jurados e telão atualizam sozinhas.
- **Trava de avaliação:** o botão **Liberar** do próximo participante fica bloqueado até **todos os jurados confirmarem** as notas do participante atual. A tela da fila mostra quem ainda falta (ex.: "Aguardando Jurado 2"). Isso garante que todos os participantes sejam avaliados por todos os jurados.

### 5.3 Locutor
- **Agora:** número, nome, idade e santo, em letra grande.
- **Próximo:** os mesmos dados, em destaque menor.
- Indica a categoria em andamento.

### 5.4 Jurado
- Topo: **número, nome e santo** do participante atual.
- Todos os quesitos na tela, cada um com **botões de 1 a 10**.
- **Enviar** → **resumo** das notas → **Trocar nota** ou **Confirmar**.
- Pode corrigir notas já confirmadas **até o organizador fechar a categoria**. Depois disso, trava.
- Não vê as notas dos outros jurados.
- Depois de confirmar, vê "Aguardando próximo participante" até a fila liberar o próximo.

### 5.5 Organizador — andamento
- Abrir categoria → acompanhar → **Fechar categoria**.
- Como a fila só avança com todas as notas confirmadas, toda categoria fechada está completamente avaliada.
- Após fechar: ranking calculado e botão **Revelar resultado** (telão e locutor ao mesmo tempo).

### 5.6 Telão / página pública
- Durante o desfile: participante atual e categoria. **Notas ocultas.**
- Após a revelação: **pódio** (1º, 2º e 3º) da categoria.
- Mesma página para a TV do evento e para o celular do público (link ou QR divulgado no local).
- Leve e com cache, para aguentar centenas de acessos simultâneos.

---

## 6. Regras de apuração

1. **Nota final** = soma de todas as notas ÷ quantidade de notas (jurados × quesitos). A trava da fila garante que todas as notas existam.
2. **Desempate**, nesta ordem:
   1. Média do 1º quesito, depois do 2º, e assim por diante;
   2. Idade (mais velho ou mais novo, conforme configurado);
   3. **Sorteio automático**, registrado com data e hora para dar transparência.
3. **Premiação:** 3 primeiros lugares de cada categoria.
4. Participante ausente no fechamento não entra no ranking.

---

## 7. Modelo de dados (resumo)

- `Organizador` (id, nome, email, senhaHash)
- `Evento` (id, organizadorId, nome, data, local, desempateIdade, exibirPrimeiroNome, status)
- `Categoria` (id, eventoId, nome, idadeMin, idadeMax, ordem, status: aguardando / em andamento / fechada / revelada)
- `Quesito` (id, eventoId, nome, ordem)
- `Jurado` (id, eventoId, numero, nome, token)
- `Acesso` (id, eventoId, funcao, token, ativo) + `Sessao` (acessoId, nomePessoa, ultimoAcesso)
- `Participante` (id, eventoId, categoriaId, numero, nome, idade, santo, status: aguardando / presente / ausente / desfilou, posicaoFila)
- `Nota` (id, participanteId, juradoId, quesitoId, valor 1–10, confirmadaEm) — única por participante + jurado + quesito
- `EstadoDesfile` (eventoId, categoriaAtualId, participanteAtualId)
- `Resultado` (categoriaId, participanteId, posicao, media, criterioDesempate, sorteioEm)

---

## 8. Segurança e privacidade

- Dados coletados no dia: apenas **nome, idade e santo**. A autorização de uso é feita na inscrição do evento.
- Página pública com opção de exibir só o primeiro nome.
- Tokens de QR aleatórios e longos, revogáveis e com expiração ao fim do evento.
- HTTPS obrigatório.
- Backup do banco antes e depois de cada evento.

---

## 9. Fora do MVP (depois de novembro)

- Painel para organizadores se cadastrarem sozinhos (no MVP, os eventos são criados manualmente).
- Pré-inscrição online por QR Code antes do evento.
- Relatórios e histórico entre edições.
- Personalização visual por evento (logo, cores).
- WebSocket para atualização instantânea.

---

## 10. Cronograma

1. **Setup:** repositório, banco, deploy no subdomínio
2. **Modelagem** do banco de dados
3. **Configuração do evento:** categorias, quesitos, jurados, regras
4. **Cadastro** de participantes
5. **Acesso por QR Code** para as funções
6. **Tela da fila**, com a trava de avaliação
7. **Tela do jurado**
8. **Tela do locutor**
9. **Apuração:** média, desempate e sorteio
10. **Telão / página pública** e revelação de resultado
11. **Ensaio geral** com a equipe: celulares reais, ~30 participantes fictícios, todas as funções
12. **Correções do ensaio** e congelamento do código
13. (Opcional) Uso no evento da outra comunidade, com suporte presencial
14. **Holywins Corumbá**

---

## 11. Pendências

- [ ] Nomes e ordem dos quesitos do Holywins
- [ ] Desempate por idade no Holywins: mais velho ou mais novo?
- [ ] Página pública do Holywins: nome completo ou primeiro nome?
- [ ] Oferecer o sistema ao evento de 31/10 neste ano ou só em 2027?
- [ ] Nome do sistema e do subdomínio
- [ ] Se um jurado ficar impedido de votar (passou mal, saiu), o organizador pode liberar a fila manualmente, com registro do motivo?
