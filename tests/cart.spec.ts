/**
 * cart.spec.ts
 *
 * Testes de UI para os fluxos do carrinho de compras do Swag Labs.
 *
 * O carrinho é uma das funcionalidades centrais de um e-commerce.
 * Testamos os cenários de adicionar, remover e contabilizar produtos,
 * garantindo que o estado do carrinho reflete sempre as ações do usuário.
 */

import { test, expect } from '@playwright/test';

// Importa utilitários compartilhados para login e adição em massa de produtos
import { login, addAllProductsToCart } from './test-utils';

test.describe('Sauce Demo cart flows', () => {

  /**
   * Teste 1: Adicionar e remover um produto do carrinho.
   *
   * Valida o fluxo básico de gerenciamento do carrinho:
   * adicionar → verificar badge → navegar → remover → verificar remoção.
   *
   * O "badge" é o contador numérico vermelho exibido sobre o ícone do carrinho.
   */
  test('should add and remove a product from the cart', async ({ page }) => {
    // Pré-condição: o usuário precisa estar logado para acessar o inventário
    await login(page);

    // Clica no botão "Add to cart" específico do produto Backpack
    // O seletor `data-test` identifica o botão com precisão, sem depender de texto ou posição
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');

    // O badge do carrinho deve atualizar para "1" imediatamente após adicionar o produto
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    // Navega para a página do carrinho clicando no ícone
    await page.click('.shopping_cart_link');

    // Verifica que a URL mudou para a página do carrinho
    await expect(page).toHaveURL(/cart.html/);

    // Verifica que o produto adicionado aparece na lista do carrinho
    await expect(page.locator('.cart_list')).toContainText('Sauce Labs Backpack');

    // Remove o produto clicando no botão "Remove" específico do Backpack
    await page.click('button[data-test="remove-sauce-labs-backpack"]');

    // Após remover, o produto não deve mais aparecer na lista
    // `.not` inverte a asserção — verifica a ausência do texto
    await expect(page.locator('.cart_list')).not.toContainText('Sauce Labs Backpack');

    // Com o carrinho vazio, o badge numérico deve ficar oculto (não apenas "0")
    await expect(page.locator('.shopping_cart_badge')).toBeHidden();
  });

  /**
   * Teste 2: Adicionar todos os produtos e verificar o contador do carrinho.
   *
   * Valida um cenário mais completo: adicionar múltiplos itens de uma vez
   * e confirmar que o badge e a lista do carrinho refletem a quantidade correta.
   *
   * O Swag Labs possui 6 produtos no inventário — este teste depende desse número.
   * A função `addAllProductsToCart` é dinâmica e clica em todos os botões encontrados.
   */
  test('should add all products and display the correct cart count', async ({ page }) => {
    await login(page);

    // Adiciona todos os 6 produtos disponíveis ao carrinho de uma vez
    await addAllProductsToCart(page);

    // O badge deve exibir "6" — um para cada produto adicionado
    await expect(page.locator('.shopping_cart_badge')).toHaveText('6');

    // Navega para a página do carrinho
    await page.click('.shopping_cart_link');

    // Verifica que existem exatamente 6 itens listados no carrinho
    // `toHaveCount` é mais preciso que `toContainText` para verificar quantidade de elementos
    await expect(page.locator('.cart_item')).toHaveCount(6);
  });

  /**
   * Teste 3: Carrinho vazio deve exibir estado adequado sem itens.
   *
   * Verifica o estado inicial do carrinho antes de qualquer adição.
   * Em e-commerces, a tela de carrinho vazio normalmente exibe uma mensagem
   * convidando o usuário a continuar comprando.
   *
   * Este teste garante que o carrinho não exibe itens fantasmas ao ser acessado
   * sem nada adicionado — comportamento importante para a confiança do usuário.
   */
  test('should show empty cart when no products have been added', async ({ page }) => {
    await login(page);

    // Navega direto para o carrinho sem adicionar nada
    await page.click('.shopping_cart_link');
    await expect(page).toHaveURL(/cart.html/);

    // Não deve haver nenhum item no carrinho
    await expect(page.locator('.cart_item')).toHaveCount(0);

    // O badge não deve estar visível quando o carrinho está vazio
    await expect(page.locator('.shopping_cart_badge')).toBeHidden();
  });

  /**
   * Teste 4: Remover produto diretamente da página do carrinho.
   *
   * O usuário pode remover itens tanto na listagem de produtos quanto dentro do carrinho.
   * Este teste garante que o botão "Remove" dentro do carrinho funciona corretamente.
   */
  test('should remove product directly from the cart page', async ({ page }) => {
    await login(page);

    // Adiciona dois produtos
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('button[data-test="add-to-cart-sauce-labs-bike-light"]');
    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');

    // Navega para o carrinho
    await page.click('.shopping_cart_link');
    await expect(page.locator('.cart_item')).toHaveCount(2);

    // Remove apenas o Backpack de dentro do carrinho
    await page.click('button[data-test="remove-sauce-labs-backpack"]');

    // Deve sobrar apenas 1 item (Bike Light)
    await expect(page.locator('.cart_item')).toHaveCount(1);
    await expect(page.locator('.cart_list')).toContainText('Sauce Labs Bike Light');
    await expect(page.locator('.cart_list')).not.toContainText('Sauce Labs Backpack');

    // Badge deve atualizar para "1"
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  /**
   * Teste 5: Botão "Continue Shopping" deve retornar à listagem de produtos.
   *
   * Valida a navegação de volta ao inventário a partir do carrinho,
   * permitindo que o usuário adicione mais produtos sem perder o carrinho atual.
   */
  test('should navigate back to inventory via continue shopping button', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');

    await expect(page).toHaveURL(/cart.html/);

    // Clica no botão "Continue Shopping"
    await page.click('[data-test="continue-shopping"]');

    // Deve retornar para o inventário
    await expect(page).toHaveURL(/inventory.html/);

    // O produto ainda deve estar no carrinho (badge visível)
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });
});
