/**
 * product.spec.ts
 *
 * Testes de UI para os fluxos de navegação e interação com produtos do Swag Labs.
 *
 * Cobre duas funcionalidades essenciais de um catálogo de produtos:
 * 1. Ordenação da listagem de produtos
 * 2. Visualização dos detalhes de um produto individual
 *
 * Testar a ordenação é importante pois impacta diretamente a experiência do usuário
 * ao navegar pelo catálogo — uma ordenação incorreta pode frustrar as compras.
 */

import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Sauce Demo product flows', () => {

  /**
   * Teste 1: Ordenar produtos por nome (Z→A) e por preço (menor→maior).
   *
   * Valida que o sistema de ordenação funciona corretamente para dois critérios:
   * - Alfabético reverso: o último produto em ordem alfabética deve aparecer primeiro
   * - Preço crescente: o produto mais barato deve aparecer primeiro
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

    // O produto mais barato (R$ 7,99) deve ser o primeiro da lista
    await expect(page.locator('.inventory_item_price').first()).toHaveText('$7.99');
  });

  /**
   * Teste 2: Visualizar detalhes de um produto e navegar de volta ao inventário.
   *
   * Valida a navegação entre a listagem e a página de detalhe de um produto.
   * Esta é uma jornada comum do usuário: ver o catálogo → clicar num produto
   * → ver os detalhes → voltar ao catálogo.
   *
   * Garantir que o botão "Back to products" funciona é essencial para
   * que o usuário não fique preso na página de detalhe.
   */
  test('should view product details and navigate back to inventory', async ({ page }) => {
    await login(page);

    // Clica no nome do primeiro produto da lista para ir à sua página de detalhe
    // `.inventory_item_name` corresponde ao título clicável de cada produto
    await page.click('.inventory_item_name');

    // Verifica que a URL mudou para a página de detalhe do produto
    await expect(page).toHaveURL(/inventory-item.html/);

    // Verifica que as informações essenciais do produto estão visíveis na página
    await expect(page.locator('.inventory_details_name')).toBeVisible();  // Nome do produto
    await expect(page.locator('.inventory_details_desc')).toBeVisible();  // Descrição do produto

    // Clica no botão de voltar ao catálogo
    await page.click('[data-test="back-to-products"]');

    // Verifica que retornou à página de inventário
    await expect(page).toHaveURL(/inventory.html/);
  });
});
