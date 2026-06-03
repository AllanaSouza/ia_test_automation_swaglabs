# 🧪 Swag Labs — Automação de Testes com Playwright

Projeto de estudo de automação de testes end-to-end para o site [Swag Labs (Sauce Demo)](https://www.saucedemo.com), desenvolvido com **Playwright** e **TypeScript**.

> **O que é o Swag Labs?**
> É um e-commerce de demonstração criado pela Sauce Labs especialmente para praticar automação de testes. Ele simula fluxos reais como login, carrinho, checkout e navegação de produtos.

---

## 📚 Conceitos praticados

Este projeto cobre diferentes camadas e tipos de teste:

| Tipo | Arquivo | O que testa |
|---|---|---|
| **Teste de API** | `api.spec.ts` | Status HTTP, headers e estrutura do HTML retornado pelo servidor |
| **Teste de Contrato** | `api-contract.spec.ts` | Formato/estrutura do `manifest.json` (contrato da API) |
| **Teste de UI — Login** | `login.spec.ts` | Fluxos de autenticação: sucesso, erro, bloqueio e logout |
| **Teste de UI — Carrinho** | `cart.spec.ts` | Adicionar, remover e contabilizar produtos no carrinho |
| **Teste de UI — Checkout** | `checkout.spec.ts` | Finalizar e cancelar o processo de compra |
| **Teste de UI — Produtos** | `product.spec.ts` | Ordenação do catálogo e visualização de detalhes |

---

## 🗂️ Estrutura do projeto

```
Swag Labs/
├── tests/
│   ├── test-utils.ts          # Funções auxiliares reutilizáveis (login, addAllProductsToCart)
│   ├── api.spec.ts            # Testes de API (camada HTTP)
│   ├── api-contract.spec.ts   # Testes de contrato da API
│   ├── login.spec.ts          # Testes de autenticação
│   ├── cart.spec.ts           # Testes do carrinho de compras
│   ├── checkout.spec.ts       # Testes do fluxo de checkout
│   └── product.spec.ts        # Testes de navegação e produtos
├── playwright-report/
│   ├── index.html             # Relatório padrão do Playwright (gerado automaticamente)
│   └── metrics.html           # Relatório de métricas customizado (gerado automaticamente)
├── metrics-reporter.ts        # Reporter customizado que gera o metrics.html
├── playwright.config.ts       # Configuração central do Playwright
├── tsconfig.json              # Configuração do TypeScript
└── package.json               # Dependências e scripts do projeto
```

---

## 🚀 Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm (já incluído no Node.js)

---

## ⚙️ Instalação

**1. Clone o repositório:**

```bash
git clone https://github.com/AllanaSouza/ia_test_automation_swaglabs.git
cd ia_test_automation_swaglabs
```

**2. Instale as dependências do projeto:**

```bash
npm install
```

**3. Instale os browsers gerenciados pelo Playwright:**

```bash
npx playwright install
```

> O Playwright gerencia suas próprias versões de Chrome, Firefox e WebKit — independente do browser instalado no sistema.

---

## ▶️ Executando os testes

### Rodar toda a suíte

```bash
npm test
```

### Rodar um arquivo específico

```bash
npx playwright test tests/login.spec.ts
```

### Rodar com interface gráfica (útil para depuração)

```bash
npm run test:headed
```

> No modo `headed`, o browser abre visivelmente e você pode acompanhar cada ação sendo executada.

### Rodar em modo debug (passo a passo)

```bash
npm run test:debug
```

> Abre o Playwright Inspector, que permite pausar a execução, inspecionar elementos e avançar passo a passo.

### Rodar apenas os testes de API

```bash
npm run test:api
```

### Rodar apenas os testes de contrato

```bash
npm run test:contract
```

---

## 📊 Relatórios

Após executar os testes, dois relatórios são gerados automaticamente na pasta `playwright-report/`:

### Relatório padrão do Playwright

Relatório visual com detalhes de cada teste, screenshots de falhas e vídeos.

```bash
npx playwright show-report
```

### Relatório de métricas customizado

Painel com estatísticas da execução: total de testes, taxa de aprovação, duração média e breakdown por arquivo.

```bash
# Windows
start playwright-report\metrics.html

# macOS/Linux
open playwright-report/metrics.html
```

---

## 🔧 Configuração

As principais configurações da suíte estão em `playwright.config.ts`:

| Configuração | Valor | Descrição |
|---|---|---|
| `baseURL` | `https://www.saucedemo.com` | URL base do sistema testado |
| `timeout` | `30s` | Tempo máximo por teste |
| `headless` | `true` | Browser sem interface gráfica |
| `browser` | Chromium | Browser padrão utilizado |
| `screenshot` | `only-on-failure` | Screenshot capturada só em falha |
| `video` | `retain-on-failure` | Vídeo salvo só em falha |

---

## 👥 Usuários de teste disponíveis

O Swag Labs oferece usuários pré-configurados para diferentes cenários:

| Usuário | Senha | Comportamento |
|---|---|---|
| `standard_user` | `secret_sauce` | Usuário padrão — fluxo normal |
| `locked_out_user` | `secret_sauce` | Conta bloqueada — exibe erro de bloqueio |
| `problem_user` | `secret_sauce` | Usuário com bugs simulados na UI |
| `performance_glitch_user` | `secret_sauce` | Login com delay artificial de performance |

---

## 🧰 Tecnologias utilizadas

- **[Playwright](https://playwright.dev/)** — framework de automação de testes E2E
- **[TypeScript](https://www.typescriptlang.org/)** — tipagem estática sobre JavaScript
- **[Node.js](https://nodejs.org/)** — ambiente de execução JavaScript
