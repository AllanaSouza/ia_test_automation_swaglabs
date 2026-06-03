/**
 * test-utils.ts
 *
 * Arquivo de utilitários compartilhados entre os testes.
 * Centralizar ações repetitivas aqui evita duplicação de código (princípio DRY).
 * Qualquer spec que precise fazer login ou adicionar produtos ao carrinho
 * importa estas funções em vez de reescrever o mesmo código.
 */

import { Page } from '@playwright/test';

/**
 * Realiza o login no Swag Labs.
 *
 * @param page     - Objeto `Page` do Playwright que representa a aba do browser
 * @param username - Nome de usuário (padrão: 'standard_user')
 * @param password - Senha (padrão: 'secret_sauce')
 *
 * Ao usar valores padrão nos parâmetros, a maioria dos testes pode simplesmente
 * chamar `login(page)` sem precisar informar credenciais.
 * Para testar cenários de erro, basta passar usuário/senha inválidos:
 *   login(page, 'locked_out_user', 'secret_sauce')
 */
export const login = async (page: Page, username = 'standard_user', password = 'secret_sauce') => {
  // Navega para a raiz do site — usa o `baseURL` definido no playwright.config.ts
  await page.goto('/');

  // Preenche os campos de formulário usando o seletor `data-test`
  // Seletores `data-test` são preferidos em automação pois não mudam com refatorações de CSS
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);

  // Clica no botão de login para submeter o formulário
  await page.click('[data-test="login-button"]');
};

/**
 * Adiciona todos os produtos disponíveis ao carrinho.
 *
 * @param page - Objeto `Page` do Playwright que representa a aba do browser
 *
 * Esta função é útil para testes que precisam de um carrinho cheio,
 * como verificar se o contador do carrinho exibe "6".
 *
 * Funciona de forma dinâmica: conta quantos botões existem e clica em todos,
 * sem depender de um número fixo de produtos.
 */
export const addAllProductsToCart = async (page: Page) => {
  // Localiza todos os botões dentro dos itens de inventário
  // `locator()` retorna um objeto lazy — a busca no DOM acontece só quando necessário
  const buttons = page.locator('.inventory_item button');

  // Conta quantos botões foram encontrados
  const count = await buttons.count();

  // Itera por cada botão e clica nele para adicionar o produto ao carrinho
  for (let index = 0; index < count; index++) {
    await buttons.nth(index).click(); // `.nth(index)` seleciona o botão pela posição
  }
};
