/**
 * product.spec.ts
 *
 * Testes de UI para os fluxos de navegação e interação com produtos do Swag Labs.
 *
 * Cobre funcionalidades essenciais de um catálogo de produtos:
 * 1. Ordenação da listagem de produtos (todos os 4 critérios)
 * 2. Visualização dos detalhes de um produto individual
 * 3. Adicionar produto diretamente da página de detalhe
 * 4. Contagem correta de produtos exibidos
 */

import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Sauce Demo product flows', () => {

  /**
   * Teste 1: Ordenar produtos por nome (Z→A) e por preço (menor→maior).
   *
   * Valida dois critérios de ordenação comuns em e-commerces.
   * A ordenação incorreta pode frustrar o usuário ao navegar pelo catálogo.
   */
  test('should sort products by name and price', async ({ page }) => {
    await login(page);

    // Confirma que estamos na página de inventário antes de interagir
    await expect(page).toHaveURL(/inventory.html/);

    // Localiza o elemento de seleção (dropdown) de ordenação
    // Armazenar em variável evita buscar o elemento múltiplas vezes no DOM
    const sort = page.locator('[data-test="product-sort-container"]');

    // Garante que o dropdown está visível antes de interagir
    await expect(sort).toBeVisible();

    // --- Ordenação: Nome Z→A ---

    // `selectOption('za')` seleciona a opção pelo seu valor `value` no HTML
    // equivale a: <option value="za">Name (Z to A)</option>
    await sort.selectOption('za');

    // Após ordenar Z→A, o primeiro produto deve ser o último alfabeticamente
    // `.first()` seleciona o primeiro elemento que corresponde ao locator
    await expect(page.locator('.inventory_item_name').first()).toHaveText(
      'Test.allTheThings() T-Shirt (Red)'
    );

    // --- Ordenação: Preço menor → maior ---

    // 'lohi' = "low to high" (do menor para o maior preço)
    await sort.selectOption('lohi');

    // O produto mais barato deve ser o primeiro da lista
    await expect(page.locator('.inventory_item_price').first()).toHaveText('$7.99');
  });

  /**
   * Teste 2: Ordenar por nome A→Z deve mostrar o primeiro produto correto.
   *
   * Valida a ordenação padrão (A→Z) — que é como o catálogo deve aparecer por default.
   */
  test('should sort products by name A to Z', async ({ page }) => {
    await login(page);

    const sort = page.locator('[data-test="product-sort-container"]');

    // Ordena A→Z (az = padrão do site)
    await sort.selectOption('az');

    // O primeiro produto em ordem alfabética deve aparecer primeiro
    await expect(page.locator('.inventory_item_name').first()).toHaveText('Sauce Labs Backpack');
  });

  /**
   * Teste 3: Ordenar por preço maior → menor.
   *
   * Valida o quarto critério de ordenação disponível.
   * Completa a cobertura de todos os 4 valores do dropdown: az, za, lohi, hilo.
   */
  test('should sort products by price high to low', async ({ page }) => {
    await login(page);

    const sort = page.locator('[data-test="product-sort-container"]');

    // 'hilo' = "high to low" (do maior para o menor preço)
    await sort.selectOption('hilo');

    // O produto mais caro deve ser o primeiro da lista
    await expect(page.locator('.inventory_item_price').first()).toHaveText('$49.99');
  });

  /**
   * Teste 4: A listagem deve exibir o número correto de produtos.
   *
   * Verifica que todos os 6 produtos do catálogo são exibidos.
   * Uma regressão aqui poderia fazer produtos desaparecerem do catálogo
   * sem qualquer aviso visual de erro.
   */
  test('should display all 6 products on the inventory page', async ({ page }) => {
    await login(page);

    // Conta todos os itens de inventário na página
    const items = page.locator('.inventory_item');
    await expect(items).toHaveCount(6);
  });

  /**
   * Teste 5: Visualizar detalhes de um produto e navegar de volta ao inventário.
   *
   * Valida a navegação entre a listagem e a página de detalhe de um produto.
   * Esta é uma jornada comum do usuário: ver o catálogo → clicar num produto
   * → ver os detalhes → voltar ao catálogo.
   */
  test('should view product details and navigate back to inventory', async ({ page }) => {
    await login(page);

    // Clica no nome do primeiro produto da lista para ir à sua página de detalhe
    await page.click('.inventory_item_name');

    // Verifica que a URL mudou para a página de detalhe do produto
    await expect(page).toHaveURL(/inventory-item.html/);

    // Verifica que as informações essenciais do produto estão visíveis na página
    await expect(page.locator('.inventory_details_name')).toBeVisible();  // Nome do produto
    await expect(page.locator('.inventory_details_desc')).toBeVisible();  // Descrição do produto
    await expect(page.locator('.inventory_details_price')).toBeVisible(); // Preço do produto

    // Clica no botão de voltar ao catálogo
    await page.click('[data-test="back-to-products"]');

    // Verifica que retornou à página de inventário
    await expect(page).toHaveURL(/inventory.html/);
  });

  /**
   * Teste 6: Adicionar produto ao carrinho diretamente da página de detalhe.
   *
   * O usuário pode adicionar o produto tanto no catálogo quanto na página de detalhe.
   * Esta funcionalidade é importante pois o usuário pode navegar para o detalhe,
   * ler a descrição, e então decidir comprar — sem precisar voltar ao catálogo.
   */
  test('should add product to cart from the product detail page', async ({ page }) => {
    await login(page);

    // Navega para a página de detalhe do primeiro produto
    await page.click('.inventory_item_name');
    await expect(page).toHaveURL(/inventory-item.html/);

    // Adiciona o produto ao carrinho a partir da página de detalhe
    await page.click('button[data-test^="add-to-cart"]');

    // O badge do carrinho deve atualizar para "1"
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    // O botão deve mudar de "Add to cart" para "Remove" após a adição
    await expect(page.locator('button[data-test^="remove"]')).toBeVisible();
  });

  /**
   * Teste 7: Acessar a página de detalhe via imagem do produto.
   *
   * Na listagem, tanto o nome quanto a imagem do produto são clicáveis.
   * Verifica que clicar na imagem também navega para a página de detalhe.
   */
  test('should navigate to product detail by clicking the product image', async ({ page }) => {
    await login(page);

    // Clica na imagem do primeiro produto (não no nome)
    await page.locator('.inventory_item img').first().click();

    // Deve navegar para a página de detalhe
    await expect(page).toHaveURL(/inventory-item.html/);
    await expect(page.locator('.inventory_details_name')).toBeVisible();
  });
});
