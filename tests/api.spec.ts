/**
 * api.spec.ts
 *
 * Testes de API (camada HTTP).
 *
 * Diferente dos testes de UI (que simulam cliques e navegação no browser),
 * testes de API validam as respostas HTTP diretamente — sem renderizar a página.
 *
 * Isso os torna muito mais rápidos e estáveis, pois não dependem do DOM.
 * São ideais para verificar status codes, headers e estrutura básica do HTML retornado.
 *
 * Usamos o objeto `request` do Playwright, que funciona como um cliente HTTP
 * (similar ao `fetch` nativo ou à biblioteca `axios`).
 */

import { test, expect } from '@playwright/test';

// Agrupa todos os testes de fluxo de API sob o mesmo namespace
test.describe('Sauce Demo API flows', () => {

  /**
   * Teste 1: A homepage deve retornar status 200 e conter o shell da SPA.
   *
   * O Swag Labs é uma SPA (Single Page Application) construída com React.
   * O servidor entrega um HTML mínimo ("shell") com um <div id="root"></div>
   * — o React injeta o conteúdo dinamicamente via JavaScript no browser.
   *
   * Este teste verifica que:
   * 1. O servidor está no ar e respondendo (HTTP 200)
   * 2. O Content-Type está correto (text/html)
   * 3. O shell HTML contém os elementos essenciais da SPA
   */
  test('homepage should return 200 and include the SPA shell', async ({ request }) => {
    // Requisição GET para a raiz do site
    const response = await request.get('/');

    // HTTP 200 = OK — o servidor processou a requisição com sucesso
    expect(response.status()).toBe(200);

    // Verifica que a resposta é HTML (não JSON, não texto puro, etc.)
    expect(response.headers()['content-type']).toContain('text/html');

    // Obtém o corpo da resposta como texto para inspecionar o HTML
    const body = await response.text();

    // Verifica a presença do elemento raiz onde o React monta a aplicação
    expect(body).toContain('<div id="root"></div>');

    // Verifica que o título da página está presente no HTML
    expect(body).toContain('<title>Swag Labs</title>');

    // Verifica que o manifest.json está referenciado — confirmando que é uma PWA
    expect(body).toContain('manifest.json');
  });

  /**
   * Teste 2: Acessar /inventory.html diretamente deve retornar 404.
   *
   * Em SPAs, as "páginas" não são arquivos físicos no servidor —
   * o roteamento acontece no browser via JavaScript (React Router, por exemplo).
   *
   * Por isso, tentar acessar /inventory.html diretamente via HTTP
   * resulta em 404 (Not Found), pois o arquivo não existe no servidor.
   *
   * Este teste documenta e valida esse comportamento esperado da arquitetura SPA.
   */
  test('direct inventory route should return 404 without browser routing', async ({ request }) => {
    const response = await request.get('/inventory.html');

    // HTTP 404 = Not Found — comportamento ESPERADO para uma SPA
    // O arquivo /inventory.html não existe fisicamente no servidor
    expect(response.status()).toBe(404);
  });
});
