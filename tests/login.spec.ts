/**
 * login.spec.ts
 *
 * Testes de UI para os fluxos de autenticação do Swag Labs.
 *
 * Cobre os cenários mais importantes de login:
 * - Caminho feliz (happy path): login com sucesso
 * - Caminhos alternativos (sad paths): credenciais inválidas, usuário bloqueado
 * - Fluxo de logout
 * - Usuários especiais com comportamentos diferentes
 *
 * Boa prática: sempre testar os cenários de erro, não apenas o fluxo de sucesso.
 * O sistema deve se comportar de forma previsível e exibir mensagens claras ao usuário.
 */

import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Sauce Demo login flows', () => {

  /**
   * Teste 1: Login com credenciais válidas (happy path).
   *
   * Verifica o fluxo mais básico e esperado:
   * usuário e senha corretos → redirecionamento para o inventário.
   */
  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page);

    await expect(page).toHaveURL(/inventory.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  /**
   * Teste 2: Credenciais inválidas devem exibir mensagem de erro.
   *
   * Testa o comportamento do sistema ao receber dados errados.
   */
  test('should display an error for invalid credentials', async ({ page }) => {
    await login(page, 'invalid_user', 'wrong_password');

    await expect(page.locator('.error-message-container')).toContainText(
      'Username and password do not match any user in this service'
    );
  });

  /**
   * Teste 3: Usuário bloqueado deve exibir mensagem específica de bloqueio.
   *
   * O Swag Labs possui um usuário especial `locked_out_user` para simular
   * um cenário de conta bloqueada.
   */
  test('should show locked out message for locked user', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');

    await expect(page.locator('.error-message-container')).toContainText(
      'Sorry, this user has been locked out.'
    );
  });

  /**
   * Teste 4: Logout deve redirecionar de volta para a página de login.
   *
   * Valida o fluxo completo de saída da aplicação.
   */
  test('should logout from inventory and return to login page', async ({ page }) => {
    await login(page);

    await page.click('#react-burger-menu-btn');
    await page.click('#logout_sidebar_link');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-test="username"]')).toBeVisible();
  });

  /**
   * Teste 5: Submeter login com campos vazios deve exibir erro.
   *
   * Valida a validação de campos obrigatórios na tela de login.
   * O sistema não deve processar uma tentativa de login sem credenciais.
   */
  test('should show error when submitting empty login form', async ({ page }) => {
    await page.goto('/');

    // Clica no botão de login sem preencher nenhum campo
    await page.click('[data-test="login-button"]');

    // Deve exibir mensagem pedindo o usuário
    await expect(page.locator('.error-message-container')).toContainText(
      'Username is required'
    );

    // A URL não deve mudar — permanece na página de login
    await expect(page).toHaveURL('/');
  });

  /**
   * Teste 6: Submeter login sem senha deve exibir erro específico.
   *
   * Verifica que a validação acontece para a senha também,
   * não apenas para o campo de usuário.
   */
  test('should show error when password is missing', async ({ page }) => {
    await page.goto('/');

    await page.fill('[data-test="username"]', 'standard_user');
    // Não preenche a senha
    await page.click('[data-test="login-button"]');

    await expect(page.locator('.error-message-container')).toContainText(
      'Password is required'
    );
  });

  /**
   * Teste 7: Após logout, não deve ser possível acessar o inventário diretamente.
   *
   * Verifica que o logout destrói a sessão e protege páginas autenticadas.
   * Um usuário que fez logout e tenta acessar /inventory.html deve ser
   * redirecionado de volta para o login — comportamento essencial de segurança.
   */
  test('should redirect to login when accessing inventory after logout', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/inventory.html/);

    // Faz logout
    await page.click('#react-burger-menu-btn');
    await page.click('#logout_sidebar_link');
    await expect(page).toHaveURL('/');

    // Tenta navegar diretamente para o inventário
    await page.goto('https://www.saucedemo.com/inventory.html');

    // Deve ser redirecionado de volta para o login
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-test="username"]')).toBeVisible();
  });

  /**
   * Teste 8: Login com performance_glitch_user deve concluir (mesmo com delay).
   *
   * O `performance_glitch_user` simula um usuário cujo login demora mais que o normal.
   * Este teste verifica que o sistema completa o login mesmo com lentidão,
   * e que o timeout configurado é suficiente para este cenário.
   *
   * Em aplicações reais, este tipo de teste ajuda a identificar regressões de performance.
   */
  test('should login successfully with performance_glitch_user', async ({ page }) => {
    // Este usuário tem delay artificial — aumentamos o timeout só para esta ação
    await login(page, 'performance_glitch_user', 'secret_sauce');

    // Mesmo com delay, deve chegar ao inventário
    await expect(page).toHaveURL(/inventory.html/, { timeout: 15000 });
    await expect(page.locator('.inventory_list')).toBeVisible();
  });
});
