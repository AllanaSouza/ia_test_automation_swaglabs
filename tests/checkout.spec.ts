/**
 * checkout.spec.ts
 *
 * Testes de UI para os fluxos de checkout (finalização de compra) do Swag Labs.
 *
 * O checkout é o fluxo mais crítico de um e-commerce — qualquer falha
 * aqui significa perda de venda. Por isso é essencial cobrir tanto o
 * caminho de sucesso quanto o de cancelamento.
 *
 * O fluxo de checkout do Swag Labs tem 3 etapas:
 *   1. Carrinho → 2. Formulário de dados (step-one) → 3. Revisão e confirmação (step-two)
 */

import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Sauce Demo checkout flows', () => {

  /**
   * Teste 1: Finalizar o checkout com sucesso (happy path completo).
   *
   * Simula um usuário real passando por todo o processo de compra:
   * login → adicionar produtos → carrinho → formulário → revisão → confirmação.
   *
   * Este é o teste mais importante do projeto — cobre o fluxo end-to-end principal.
   */
  test('should complete the checkout successfully', async ({ page }) => {
    await login(page);

    // Adiciona dois produtos ao carrinho para simular uma compra com múltiplos itens
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('button[data-test="add-to-cart-sauce-labs-bike-light"]');

    // Navega para o carrinho e inicia o processo de checkout
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    // --- ETAPA 1: Formulário de dados pessoais ---

    // Verifica que avançamos para a primeira etapa do checkout
    await expect(page).toHaveURL(/checkout-step-one.html/);

    // Preenche os dados obrigatórios do formulário
    // `page.fill()` limpa o campo antes de digitar — mais confiável que `page.type()`
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');

    // Avança para a etapa de revisão
    await page.click('[data-test="continue"]');

    // --- ETAPA 2: Revisão do pedido ---

    // Verifica que chegamos na segunda etapa (resumo da compra)
    await expect(page).toHaveURL(/checkout-step-two.html/);

    // Verifica que o resumo contém as seções de informação de pagamento e envio
    // `.summary_info` é o container que agrupa esses dados na página
    await expect(page.locator('.summary_info')).toContainText('Payment Information');
    await expect(page.locator('.summary_info')).toContainText('Shipping Information');

    // Finaliza a compra clicando em "Finish"
    await page.click('[data-test="finish"]');

    // --- CONFIRMAÇÃO ---

    // Verifica a mensagem de sucesso no cabeçalho da página de confirmação
    // `toHaveText` verifica o texto EXATO — diferente de `toContainText` que é parcial
    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');

    // Verifica que a mensagem de despacho do pedido está presente
    await expect(page.locator('.complete-text')).toContainText('Your order has been dispatched');
  });

  /**
   * Teste 2: Cancelar o checkout deve retornar ao carrinho com os itens preservados.
   *
   * Verifica que ao cancelar o processo de checkout:
   * 1. O usuário retorna para a página do carrinho
   * 2. Os produtos ainda estão lá (o cancelamento não remove itens do carrinho)
   *
   * Este é um cenário comum: o usuário inicia o checkout, percebe que
   * quer alterar algo e volta — os dados não devem ser perdidos.
   */
  test('should cancel checkout and return to the cart page', async ({ page }) => {
    await login(page);

    // Adiciona um produto e navega para o checkout
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    // Preenche o formulário parcialmente (simula usuário que começou e desistiu)
    await page.fill('[data-test="firstName"]', 'Jane');
    await page.fill('[data-test="lastName"]', 'Smith');
    await page.fill('[data-test="postalCode"]', '54321');

    // Clica em "Cancel" em vez de continuar
    await page.click('[data-test="cancel"]');

    // Deve retornar à página do carrinho
    await expect(page).toHaveURL(/cart.html/);

    // O produto deve continuar no carrinho após o cancelamento
    await expect(page.locator('.cart_list')).toContainText('Sauce Labs Backpack');
  });

  /**
   * Teste 3: Submeter o formulário vazio deve exibir erro de validação.
   *
   * Campos obrigatórios sem preenchimento não devem avançar o checkout.
   * O sistema deve fornecer feedback claro ao usuário sobre o que está faltando.
   *
   * Cenário de validação crítico: sem esta verificação, um usuário poderia
   * avançar sem dados de entrega, causando erros no processamento do pedido.
   */
  test('should show error when submitting checkout form without required fields', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    // Clica em "Continue" sem preencher nenhum campo
    await page.click('[data-test="continue"]');

    // O sistema deve exibir uma mensagem de erro
    // O Swag Labs valida o firstName primeiro — essa é a mensagem esperada
    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');

    // A URL NÃO deve avançar para step-two — permanece em step-one
    await expect(page).toHaveURL(/checkout-step-one.html/);
  });

  /**
   * Teste 4: Submeter formulário só com o primeiro campo preenchido.
   *
   * Valida que cada campo obrigatório é verificado individualmente.
   * O Swag Labs valida em sequência: firstName → lastName → postalCode.
   */
  test('should show error when last name is missing', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    // Preenche apenas o primeiro nome
    await page.fill('[data-test="firstName"]', 'John');
    await page.click('[data-test="continue"]');

    // Deve exigir o sobrenome
    await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');
  });

  /**
   * Teste 5: Submeter formulário sem CEP deve exibir erro específico.
   *
   * Complementa os testes anteriores cobrindo o terceiro campo obrigatório.
   */
  test('should show error when postal code is missing', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    // Preenche nome e sobrenome mas não o CEP
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.click('[data-test="continue"]');

    // Deve exigir o CEP
    await expect(page.locator('[data-test="error"]')).toContainText('Postal Code is required');
  });

  /**
   * Teste 6: O resumo do pedido (step-two) deve exibir o total correto.
   *
   * Valida que o valor total exibido no resumo é consistente com os itens adicionados.
   * Em e-commerces, erros de cálculo de preço são críticos e podem gerar prejuízo.
   *
   * O Swag Labs usa valores fixos — verificamos que o campo de total está presente
   * e contém um valor monetário válido (não está zerado ou vazio).
   */
  test('should display order total on checkout step two', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');

    await expect(page).toHaveURL(/checkout-step-two.html/);

    // O total deve estar visível e conter um valor monetário (símbolo $)
    const totalLabel = page.locator('.summary_total_label');
    await expect(totalLabel).toBeVisible();
    const totalText = await totalLabel.innerText();
    expect(totalText).toContain('$');
    expect(totalText).not.toBe('Total: $0.00'); // total não pode ser zero com item no carrinho
  });
});
