/**
 * accessibility.spec.ts
 *
 * Testes de Acessibilidade (A11y) para o Swag Labs.
 *
 * O que é acessibilidade em testes?
 * Acessibilidade (abreviada como "a11y" — 11 letras entre o 'a' e o 'y') garante que
 * pessoas com deficiências visuais, motoras, cognitivas ou auditivas consigam usar
 * a aplicação — seja com leitores de tela, navegação por teclado ou outros recursos.
 *
 * Ferramenta utilizada: axe-core
 * O axe-core é o engine de acessibilidade mais usado no mercado. Ele analisa o DOM
 * da página e verifica automaticamente dezenas de regras baseadas nos padrões WCAG
 * (Web Content Accessibility Guidelines).
 *
 * WCAG é o padrão internacional de acessibilidade web, mantido pelo W3C.
 * Níveis: A (mínimo), AA (recomendado), AAA (avançado).
 *
 * Como funciona neste arquivo:
 * 1. Navegamos para uma página com o Playwright
 * 2. Executamos a análise com `AxeBuilder`
 * 3. O teste falha se houver violações de acessibilidade (ou as documenta como known issues)
 *
 * Importante: testes automatizados cobrem ~30-40% dos problemas de acessibilidade.
 * Testes manuais com leitores de tela (NVDA, VoiceOver) ainda são necessários
 * para uma validação completa.
 *
 * Documentação: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * BUGS DE ACESSIBILIDADE CONHECIDOS NO SWAG LABS (site de terceiro, sem correção):
 *
 * 1. Página de Login (com erro visível):
 *    Regra: button-name | Impacto: CRITICAL
 *    O botão "X" de fechar a mensagem de erro (<button class="error-button">)
 *    não tem texto visível, aria-label nem title — leitores de tela não conseguem
 *    identificá-lo. Correção ideal: adicionar aria-label="Fechar mensagem de erro".
 *
 * 2. Página de Inventário:
 *    Regra: select-name | Impacto: CRITICAL
 *    O <select> de ordenação de produtos não tem <label> associado, aria-label
 *    nem title — leitores de tela anunciam apenas "combo box" sem contexto.
 *    Correção ideal: adicionar <label for="product-sort">Ordenar por</label>
 *    ou aria-label="Ordenar produtos por".
 *
 * Os testes que detectam estes bugs usam `.toBeGreaterThan(0)` para documentar
 * que a violação existe, em vez de `.toHaveLength(0)` que falharia continuamente.
 * Esta é uma prática comum quando testamos sistemas de terceiros que não podemos corrigir.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './test-utils';

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA DE LOGIN
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Acessibilidade — Página de Login', () => {

  /**
   * Teste 1: A página de login (estado inicial, sem erros) não deve ter violações.
   *
   * A página de login é a porta de entrada da aplicação.
   * Se ela não for acessível, nenhuma pessoa com deficiência consegue nem entrar no sistema.
   * Testamos o estado inicial — antes de qualquer interação.
   */
  test('não deve ter violações de acessibilidade na página de login', async ({ page }) => {
    await page.goto('/');

    /**
     * `AxeBuilder` é o construtor da análise de acessibilidade.
     * `.withTags(['wcag2a', 'wcag2aa'])` limita a análise às regras WCAG 2.x nível A e AA —
     * o padrão mais adotado em legislações de acessibilidade ao redor do mundo.
     * `.analyze()` injeta o axe no DOM e executa a varredura, retornando um relatório.
     */
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    /**
     * `violations` é o array de problemas encontrados.
     * Cada violação contém: id da regra, impacto (critical/serious/moderate/minor),
     * descrição, elementos afetados e como corrigir.
     */
    if (results.violations.length > 0) {
      console.log('Violações encontradas na página de login:');
      results.violations.forEach((violation) => {
        console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          console.log('  Elemento:', node.target);
          console.log('  Como corrigir:', node.failureSummary);
        });
      });
    }

    // O estado inicial da página de login não tem violações — deve passar
    expect(results.violations).toHaveLength(0);
  });

  /**
   * Teste 2: Campos do formulário de login devem ter identificação acessível.
   *
   * Leitores de tela anunciam o nome de um campo ao focar nele.
   * Sem um `<label>` associado (ou atributo `aria-label`), o usuário não sabe
   * para que serve aquele campo.
   *
   * Aqui verificamos programaticamente que os inputs têm algum texto identificador.
   */
  test('campos do formulário de login devem ter labels acessíveis', async ({ page }) => {
    await page.goto('/');

    const usernameInput = page.locator('[data-test="username"]');
    await expect(usernameInput).toBeVisible();

    /**
     * `getAttribute('placeholder')` lê o atributo placeholder do elemento.
     * Embora placeholder não substitua um label formal, o axe aceita como
     * técnica complementar de identificação do campo.
     */
    const usernamePlaceholder = await usernameInput.getAttribute('placeholder');
    expect(usernamePlaceholder).toBeTruthy(); // deve ter algum texto identificador

    const passwordInput = page.locator('[data-test="password"]');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    expect(passwordPlaceholder).toBeTruthy();
  });

  /**
   * Teste 3: Documenta o bug de acessibilidade na mensagem de erro.
   *
   * BUG CONHECIDO: quando a mensagem de erro aparece, um botão "X" sem texto
   * acessível fica visível — violando a regra WCAG 4.1.2 (button-name).
   *
   * Este teste DOCUMENTA a existência do bug, verificando que a violação ocorre.
   * Em um projeto real onde temos acesso ao código, o correto seria:
   *   1. Corrigir o bug (adicionar aria-label no botão)
   *   2. Mudar o expect para `.toHaveLength(0)`
   */
  test('documenta bug: botão de fechar erro não tem nome acessível', async ({ page }) => {
    await page.goto('/');

    // Provoca o erro submetendo credenciais inválidas
    await page.fill('[data-test="username"]', 'user_invalido');
    await page.fill('[data-test="password"]', 'senha_errada');
    await page.click('[data-test="login-button"]');

    // Aguarda a mensagem de erro aparecer
    await expect(page.locator('.error-message-container')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filtra apenas a violação específica do botão sem nome
    const buttonNameViolation = results.violations.find((v) => v.id === 'button-name');

    /**
     * Esta asserção DOCUMENTA o bug:
     * - Se `buttonNameViolation` existir, o bug ainda está presente (esperado para este site)
     * - Se for undefined, o bug foi corrigido — seria hora de atualizar este teste
     *
     * Usamos `toBeDefined()` pois sabemos que o bug existe neste site de terceiro.
     */
    console.log('\n[BUG DOCUMENTADO] button-name: botão "X" de fechar erro não tem nome acessível');
    console.log('Impacto: CRITICAL | Regra WCAG: 4.1.2 | Correção: adicionar aria-label ao botão');
    expect(buttonNameViolation).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA DE INVENTÁRIO (PRODUTOS)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Acessibilidade — Página de Inventário', () => {

  /**
   * Teste 4: Documenta o bug de acessibilidade no select de ordenação.
   *
   * BUG CONHECIDO: o <select> de ordenação não tem label associado.
   * Regra violada: select-name (WCAG 4.1.2) | Impacto: CRITICAL
   *
   * Correção ideal: adicionar <label for="product-sort">Ordenar por</label>
   * ou aria-label="Ordenar produtos por" diretamente no elemento <select>.
   */
  test('documenta bug: select de ordenação não tem label acessível', async ({ page }) => {
    await login(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filtra apenas a violação do select sem nome
    const selectNameViolation = results.violations.find((v) => v.id === 'select-name');

    console.log('\n[BUG DOCUMENTADO] select-name: <select> de ordenação não tem <label> associado');
    console.log('Impacto: CRITICAL | Regra WCAG: 4.1.2 | Correção: adicionar aria-label="Ordenar produtos"');

    // Documenta que o bug existe neste site
    expect(selectNameViolation).toBeDefined();
  });

  /**
   * Teste 5: Além dos bugs conhecidos, não devem existir OUTRAS violações na página.
   *
   * Usamos `.exclude()` para ignorar os elementos com bugs conhecidos do site
   * e verificar que o restante da página está acessível.
   *
   * Esta é uma técnica importante: isolar os problemas conhecidos para não
   * bloquear a detecção de novos problemas.
   */
  test('página de inventário não deve ter outras violações além dos bugs conhecidos', async ({ page }) => {
    await login(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      /**
       * `.exclude()` ignora elementos específicos da análise.
       * Aqui excluímos o <select> com o bug conhecido para verificar o restante.
       * Equivale a dizer: "já sei deste problema, verifica o resto da página."
       */
      .exclude('[data-test="product-sort-container"]')
      .analyze();

    if (results.violations.length > 0) {
      console.log('\nViolações inesperadas encontradas na página de inventário:');
      results.violations.forEach((v) => {
        console.log(`\n[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
        v.nodes.forEach((n) => console.log('  Elemento:', n.target));
      });
    }

    // Sem o select problemático, não deve haver outras violações
    expect(results.violations).toHaveLength(0);
  });

  /**
   * Teste 6: Imagens dos produtos devem ter texto alternativo (atributo alt).
   *
   * O atributo `alt` em imagens é fundamental para acessibilidade:
   * - Leitores de tela leem o alt para descrever a imagem ao usuário
   * - Se alt estiver vazio (""), a imagem é tratada como decorativa
   * - Se alt estiver ausente, o leitor de tela pode ler o nome do arquivo (péssima UX)
   *
   * Para imagens de produtos em um e-commerce, o alt deve descrever o produto.
   */
  test('imagens dos produtos devem ter atributo alt definido', async ({ page }) => {
    await login(page);

    // Seleciona todas as imagens dos produtos no inventário
    const productImages = page.locator('.inventory_item img');
    const count = await productImages.count();

    // Garante que há pelo menos uma imagem para testar
    expect(count).toBeGreaterThan(0);

    // Verifica que cada imagem tem o atributo alt presente e não vazio
    for (let i = 0; i < count; i++) {
      const alt = await productImages.nth(i).getAttribute('alt');

      /**
       * `alt` não deve ser null (ausente) nem string vazia.
       * Para imagens de produto, queremos um texto descritivo real.
       * `toBeTruthy()` rejeita null, undefined e string vazia "".
       */
      expect(alt, `Imagem ${i + 1} não tem atributo alt definido`).toBeTruthy();
    }
  });

  /**
   * Teste 7: Botões de adicionar ao carrinho devem ter nomes acessíveis.
   *
   * Botões sem texto visível ou atributo `aria-label` são anunciados como "botão"
   * pelo leitor de tela — sem contexto algum do que ele faz.
   * Um botão acessível deve ter um nome que descreva sua ação.
   */
  test('botões de adicionar ao carrinho devem ter nomes acessíveis', async ({ page }) => {
    await login(page);

    // Seleciona todos os botões dentro dos cards de produto
    const addButtons = page.locator('.inventory_item button');
    const count = await addButtons.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = addButtons.nth(i);

      // O texto visível do botão (innerText) serve como nome acessível
      const text = await button.innerText();
      expect(text.trim(), `Botão ${i + 1} está sem texto acessível`).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA DO CARRINHO
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Acessibilidade — Página do Carrinho', () => {

  /**
   * Teste 8: A página do carrinho não deve ter violações de acessibilidade.
   *
   * Testamos o carrinho com um produto adicionado para validar o estado
   * mais comum em que o usuário vai interagir com esta página.
   */
  test('não deve ter violações de acessibilidade na página do carrinho', async ({ page }) => {
    await login(page);

    // Adiciona um produto para que o carrinho não esteja vazio durante o teste
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('\nViolações encontradas na página do carrinho:');
      results.violations.forEach((v) => {
        console.log(`\n[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
        v.nodes.forEach((n) => console.log('  Elemento:', n.target));
      });
    }

    expect(results.violations).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FLUXO DE CHECKOUT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Acessibilidade — Fluxo de Checkout', () => {

  /**
   * Teste 9: O formulário da etapa 1 do checkout deve ser acessível.
   *
   * Formulários são especialmente sensíveis em termos de acessibilidade:
   * campos sem label, validações sem feedback e grupos sem fieldset
   * são erros comuns que prejudicam usuários de tecnologias assistivas.
   */
  test('formulário de checkout (etapa 1) não deve ter violações', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');

    // Aguarda estar na etapa 1 antes de analisar
    await expect(page).toHaveURL(/checkout-step-one.html/);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('\nViolações encontradas no formulário de checkout:');
      results.violations.forEach((v) => {
        console.log(`\n[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
        v.nodes.forEach((n) => console.log('  Elemento:', n.target));
      });
    }

    expect(results.violations).toHaveLength(0);
  });

  /**
   * Teste 10: A página de confirmação do pedido deve ser acessível.
   *
   * A tela de confirmação é o feedback final ao usuário de que a compra foi concluída.
   * É crítico que essa mensagem seja acessível — especialmente o cabeçalho de sucesso.
   */
  test('página de confirmação do pedido não deve ter violações', async ({ page }) => {
    await login(page);
    await page.click('button[data-test="add-to-cart-sauce-labs-backpack"]');
    await page.click('.shopping_cart_link');
    await page.click('button[data-test="checkout"]');
    await page.fill('[data-test="firstName"]', 'John');
    await page.fill('[data-test="lastName"]', 'Doe');
    await page.fill('[data-test="postalCode"]', '12345');
    await page.click('[data-test="continue"]');
    await page.click('[data-test="finish"]');

    // Aguarda a confirmação aparecer
    await expect(page.locator('.complete-header')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('\nViolações encontradas na página de confirmação:');
      results.violations.forEach((v) => {
        console.log(`\n[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
        v.nodes.forEach((n) => console.log('  Elemento:', n.target));
      });
    }

    expect(results.violations).toHaveLength(0);
  });
});
