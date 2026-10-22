# ConectaPro — Web

Front-end web do **ConectaPro**, um marketplace bilateral de serviços que conecta clientes a profissionais autônomos (eletricistas, encanadores, diaristas e afins).

O ciclo completo cobre busca de profissional, abertura da demanda, aceite com definição de valor, pagamento, execução e avaliação mútua.

Projeto acadêmico desenvolvido na disciplina de Projeto e Prática — IFPE, Campus Jaboatão dos Guararapes.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Biblioteca | React 19 |
| Build | Vite 7 |
| Rotas | React Router 7 |
| HTTP | Axios |
| Formulários | React Hook Form + React IMask |
| Notificações | React Toastify |
| Ícones | Bootstrap Icons |
| E-mail (Fale Conosco) | EmailJS |
| Lint | ESLint 9 |

O back-end fica em repositório separado ([`backend-pp1`](https://github.com/alana0vit/backend-pp1)), em Java 21 com Spring Boot 3.5 e PostgreSQL.

---

## Rodando localmente

### Pré-requisitos

- **Node 22** (versão usada no CI)
- Back-end rodando — por padrão em `http://localhost:8080`

### Passos

```bash
npm install
cp .env.example .env    # preencha as variáveis
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

### Variáveis de ambiente

Crie um `.env` na raiz a partir do `.env.example`:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_API_URL` | Sim | URL base do back-end (ex.: `http://localhost:8080`) |
| `VITE_EMAILJS_SERVICE_ID` | Não | Credenciais do EmailJS, usadas apenas pelo "Fale Conosco" |
| `VITE_EMAILJS_TEMPLATE_ID` | Não | — |
| `VITE_EMAILJS_PUBLIC_KEY` | Não | — |

Sem as variáveis do EmailJS o restante da aplicação funciona normalmente; só o envio do formulário de contato fica indisponível.

> O `.env` está no `.gitignore` e nunca deve ser versionado.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint em todo o projeto |

---

## Estrutura

```
src/
├── assets/              Imagens e logos
├── components/          Componentes reutilizáveis
│   ├── Header / Footer
│   ├── HeroSection / HowItWorks / AppPromo
│   ├── DemandFotos          Galeria de imagens da demanda
│   ├── DemandInfoBadges     Valor, data e categoria em formato de badge
│   └── HistoricoAvaliacoes  Avaliações recebidas por um profissional
├── pages/               Uma pasta por tela (.jsx + .css)
├── services/
│   └── api.js           Instância Axios + interceptor de JWT
├── utils/
│   ├── errorUtils.js    Extrai mensagem de erro das respostas da API
│   ├── imageUtils.js    Monta a URL pública de uma imagem
│   └── statusUtils.js   Traduz DemandStatus para rótulo e classe CSS
└── App.jsx              Rotas e guardas de acesso
```

---

## Autenticação

O login grava em `localStorage`, na chave `@ConectaPro:user`, um objeto com os dados do usuário e o token JWT.

O interceptor em `src/services/api.js` injeta esse token no header `Authorization` de toda requisição:

```js
config.headers.Authorization = `Bearer ${userObj.token}`;
```

As rotas protegidas usam três guardas definidas em `App.jsx`, que diferenciam o acesso por `userType`:

- `RotaPrivadaCliente` — exige `CLIENT`
- `RotaPrivadaProfissional` — exige `PROFESSIONAL`
- `RotaPrivadaGeral` — exige apenas estar autenticado

---

## Rotas

### Públicas

| Rota | Tela |
|---|---|
| `/` | Home |
| `/login` | Login |
| `/cadastro` | Cadastro de cliente ou profissional |
| `/esqueceu-senha` | Solicitação de recuperação de senha |
| `/reset-password` | Redefinição via token recebido por e-mail |
| `/planos` | Planos de verificação para profissionais |
| `/faq` · `/fale-conosco` · `/termos-de-uso` | Institucionais |

### Cliente

| Rota | Tela |
|---|---|
| `/dashboard-cliente` | Demandas abertas, pagamento e avaliação |
| `/lista-profissionais` | Busca com filtros de nome, categoria, nota e raio |
| `/solicitar-servico` | Abertura de demanda |
| `/detalhes-solicitacao` | Detalhes da solicitação |
| `/editar-demanda/:id` | Edição (apenas demandas `ABERTO`) |

### Profissional

| Rota | Tela |
|---|---|
| `/dashboard-profissional` | Recebe, aceita, recusa e finaliza demandas |

### Autenticado (ambos)

| Rota | Tela |
|---|---|
| `/editar-perfil` | Dados cadastrais, foto e categorias |

---

## Ciclo de vida da demanda

O status é controlado pelo back-end e traduzido para a interface em `src/utils/statusUtils.js`.

```
                        ┌──────────► REJEITADO
                        │            (profissional recusa)
ABERTO ─────────────────┤
  │                     │
  │                     └──────────► EXPIRADO
  │                                  (1h sem resposta → pode ser reatribuída)
  │ profissional aceita
  │ e define o valor final
  ▼
AGUARDANDO_PAGAMENTO
  │ cliente paga
  ▼
AGUARDANDO ───────────► FECHADO
  (em execução)          (concluída e avaliada)
```

Pontos que a interface precisa respeitar:

- **Só demandas `ABERTO` podem ser editadas.** O back-end recusa as demais.
- **O aceite não passa pelo endpoint de status.** Vai por `PATCH /api/demand/{id}/accept`, enviando o `finalValue`.
- **Dados de contato ficam ocultos** até a demanda chegar em `AGUARDANDO` — ver `contatoLiberado()` em `statusUtils.js`.
- **Demandas `REJEITADO` ou `EXPIRADO`** podem ser reatribuídas a outro profissional pela lista de profissionais.

---

## Planos e verificação

Profissionais podem assinar um plano (Bronze, Prata ou Ouro) em `/planos`. O plano ativo concede:

- Selo de verificado (`verified`), exibido na busca e no dashboard
- Prioridade na ordenação da lista de profissionais (`activePlanName`)
- Taxa de plataforma diferenciada nas demandas pagas

O checkout é simulado: a API devolve uma `checkoutUrl` e o usuário é redirecionado para uma página de pagamento fictícia servida pelo próprio back-end.

---

## Integração com a API

Todos os caminhos são relativos a `VITE_API_URL`.

| Área | Endpoints principais |
|---|---|
| Autenticação | `POST /auth/login`, `/auth/forgot-password`, `/auth/reset-password` |
| Usuários | `GET/POST/PUT/DELETE /api/user`, `/api/user/search`, `/api/user/{id}/photo` |
| Endereços | `GET /api/user/{userId}/addresses` |
| Categorias | `GET /api/category` |
| Demandas | `POST /api/demand`, `GET /api/demand/user`, `PATCH /api/demand/{id}`, `/accept`, `/status`, `/reassign` |
| Imagens | `GET /api/images/{nomeArquivo}`, `DELETE /api/demand/{id}/images/{nomeArquivo}` |
| Avaliações | `POST /api/rating`, `PUT /api/rating/{id}`, `GET /api/rating/user/{userId}` |
| Pagamentos | `POST /api/payments/demand/{demandId}/checkout` |
| Assinaturas | `GET /api/subscriptions/plans`, `POST .../checkout` |

A documentação interativa fica em `{VITE_API_URL}/swagger-ui/index.html` com o back-end rodando.

### Imagens

O back-end armazena os arquivos no Cloudflare R2, mas o front nunca acessa o R2 diretamente: guarda apenas o **nome do arquivo** e monta a URL via `getImageUrl()`, que aponta para `GET /api/images/{nomeArquivo}`.

---

## CI

O workflow `.github/workflows/ci.yml` roda em todo push e PR para `main` e `develop`:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. Publica o `dist/` como artefato (retenção de 7 dias)

As variáveis `VITE_*` são injetadas no build a partir dos *secrets* do repositório.

---

## Contribuindo

A branch `main` é protegida. O fluxo é:

```bash
git checkout develop
git pull origin develop
# alterações
git commit -m "feat: descricao da mudanca"
git push origin develop
```

Depois, abra um Pull Request de `develop` para `main`. O CI precisa passar para o merge ser liberado.