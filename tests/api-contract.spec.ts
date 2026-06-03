/**
 * api-contract.spec.ts
 *
 * Testes de Contrato de API (API Contract Testing).
 *
 * O objetivo é garantir que a estrutura (contrato) de um endpoint
 * não muda inesperadamente entre versões — independente do conteúdo exato dos dados.
 *
 * Diferença entre testes de API e testes de contrato:
 * - Testes de API verificam comportamentos e fluxos (ex: "o login retorna token?")
 * - Testes de contrato verificam o "formato" da resposta (ex: "o campo 'name' existe e é string?")
 *
 * Aqui usamos o `request` do Playwright, que faz chamadas HTTP diretamente,
 * sem abrir um browser — mais rápido e adequado para validar APIs.
 */

import { test, expect } from '@playwright/test';

// `test.describe` agrupa testes relacionados sob um mesmo nome
test.describe('Sauce Demo API contract', () => {

  /**
   * Teste: o arquivo manifest.json deve seguir o contrato esperado.
   *
   * O manifest.json é um arquivo padrão de Progressive Web Apps (PWA).
   * Ele define metadados do aplicativo como nome, ícones e cores de tema.
   * Validar seu contrato garante que a aplicação continua sendo uma PWA válida.
   *
   * Usamos `{ request }` em vez de `{ page }` — não precisamos do browser,
   * apenas de um cliente HTTP simples.
   */
  test('manifest.json should follow the expected contract', async ({ request }) => {
    // Faz uma requisição GET para /manifest.json
    // O Playwright combina isso com o `baseURL` do config: https://www.saucedemo.com/manifest.json
    const response = await request.get('/manifest.json');

    // Verifica que o servidor respondeu com sucesso (HTTP 200)
    expect(response.status()).toBe(200);

    // Verifica que o servidor retornou JSON no header Content-Type
    expect(response.headers()['content-type']).toContain('application/json');

    // Parseia o corpo da resposta como objeto JSON
    const manifest = await response.json();

    /**
     * `expect.objectContaining()` verifica que o objeto possui PELO MENOS estes campos.
     * Campos extras no objeto são permitidos — foco na estrutura mínima esperada.
     *
     * `expect.any(String)` valida que o valor existe e é do tipo String,
     * sem verificar o valor exato — perfeito para testes de contrato.
     */
    expect(manifest).toEqual(expect.objectContaining({
      theme_color: expect.any(String),       // Cor do tema do browser (ex: '#E2231A')
      background_color: expect.any(String),  // Cor de fundo na tela de splash
      display: expect.any(String),           // Modo de exibição (ex: 'standalone')
      scope: expect.any(String),             // Escopo de navegação da PWA
      start_url: expect.any(String),         // URL inicial ao abrir o app
      name: expect.any(String),              // Nome completo do aplicativo
      short_name: expect.any(String),        // Nome curto (exibido na tela inicial do celular)
      icons: expect.any(Array),              // Lista de ícones do aplicativo
    }));

    // Verificação extra: garante que `icons` é realmente um array
    expect(Array.isArray(manifest.icons)).toBe(true);

    // Garante que há pelo menos um ícone definido
    expect(manifest.icons.length).toBeGreaterThan(0);

    /**
     * Valida o contrato de cada ícone individualmente.
     * Um loop `for...of` em async/await é seguro no Playwright —
     * cada asserção é executada em sequência.
     */
    for (const icon of manifest.icons) {
      expect(icon).toEqual(
        expect.objectContaining({
          src: expect.any(String),    // Caminho para o arquivo de imagem do ícone
          sizes: expect.any(String),  // Dimensões do ícone (ex: '192x192')
          type: expect.any(String),   // Tipo MIME do ícone (ex: 'image/png')
        })
      );
    }
  });
});
