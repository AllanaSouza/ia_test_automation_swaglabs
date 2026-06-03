/**
 * playwright.config.ts
 *
 * Arquivo central de configuração do Playwright.
 * Aqui definimos como todos os testes serão executados:
 * onde estão os arquivos, qual o timeout, quais browsers usar, etc.
 *
 * Documentação oficial: https://playwright.dev/docs/test-configuration
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Diretório onde o Playwright vai procurar os arquivos de teste (*.spec.ts)
  testDir: './tests',

  // Tempo máximo que um teste inteiro pode levar antes de ser abortado (30 segundos)
  timeout: 30 * 1000,

  // Configurações específicas para as asserções com `expect()`
  expect: {
    // Tempo máximo que o Playwright aguarda uma asserção ser satisfeita (5 segundos)
    // Útil para elementos que aparecem de forma assíncrona na tela
    timeout: 5000,
  },

  /**
   * Reporters: definem como os resultados dos testes são exibidos e salvos.
   * - 'list'          → exibe cada teste em uma linha no terminal
   * - 'html'          → gera um relatório visual em HTML na pasta playwright-report/
   * - metrics-reporter → reporter customizado deste projeto (gera metrics.html)
   */
  reporter: [['list'], ['html', { open: 'never' }], ['./metrics-reporter.ts']],

  // Configurações globais aplicadas a todos os testes
  use: {
    // URL base do sistema sob teste — usada em calls como page.goto('/') ou request.get('/')
    baseURL: 'https://www.saucedemo.com',

    // Headless: true = o browser roda sem interface gráfica (mais rápido em CI/CD)
    // false = abre o browser visivelmente (útil para depuração local)
    headless: true,

    // Resolução do viewport do browser simulado
    viewport: { width: 1280, height: 720 },

    // Tempo máximo para uma ação individual (click, fill, etc.) ser concluída
    actionTimeout: 10000,

    // Ignora erros de certificado HTTPS — útil em ambientes de teste com certificados autoassinados
    ignoreHTTPSErrors: true,

    // Captura screenshot apenas quando um teste falha (ajuda na depuração)
    screenshot: 'only-on-failure',

    // Grava vídeo da execução apenas quando um teste falha
    video: 'retain-on-failure',
  },

  /**
   * Projects: permite executar os mesmos testes em múltiplos browsers/dispositivos.
   * Aqui usamos apenas o Chromium (base do Google Chrome).
   * Poderíamos adicionar 'firefox', 'webkit' (Safari), ou dispositivos móveis.
   */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }, // spread das configurações padrão do Chrome Desktop
    },
  ],
});
