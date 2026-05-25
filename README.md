# Swag Labs Automation

Projeto de automação de testes para o site [https://www.saucedemo.com](https://www.saucedemo.com).

## Tecnologias

- Node.js
- Playwright
- TypeScript

## Como usar

1. Instale as dependências:

```bash
npm install
```

2. Execute os testes:

```bash
npm test
```

3. Execute em modo com interface:

```bash
npm run test:headed
```

4. Execute os testes de API:

```bash
npm run test:api
```

4. Execute os testes de contrato da API:

```bash
npm run test:contract
```

5. Gere e abra o relatório HTML:

```bash
npx playwright show-report
```

6. Abra o relatório de métricas executivas:

```bash
start playwright-report\metrics.html
```
