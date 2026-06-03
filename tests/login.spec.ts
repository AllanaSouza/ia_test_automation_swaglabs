/**
 * login.spec.ts
 *
 * Testes de UI para os fluxos de autenticação do Swag Labs.
 *
 * Cobre os cenários mais importantes de login:
 * - Caminho feliz (happy path): login com sucesso
 * - Caminhos alternativos (sad paths): credenciais inválidas, usuário bloqueado
 * - Fluxo de logout
 *
 * Boa prática: sempre testar os cenários de erro, não apenas o fluxo de sucesso.
 * O sistema deve se comportar de forma previsível e exibir mensagens claras ao usuário.
 */

import { test, expect } from '@playwright/test';

// Importa a função utilitária de login — evita repetição de código
import { login } from './test-utils';

test.describe('Sauce Demo login flows', () => {

  /**
   * Teste 1: Login com credenciais válidas (happy path).
   *
   * Verifica o fluxo mais básico e esperado:
   * usuário e senha corretos → redirecionamento para o inventário.
   *
   * `login(page)` usa os valores padrão: 'standard_user' / 'secret_sauce'
   */
  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page);

    // Após login bem-sucedido, a URL deve conter 'inventory.html'
    // `toHaveURL(/inventory.html/)` usa uma RegExp — mais flexível que comparar strings exatas
    await expect(page).toHaveURL(/inventory.html/);

    // A lista de produtos deve estar visível, confirmando que a página carregou corretamente
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  /**
   * Teste 2: Credenciais inválidas devem exibir mensagem de erro.
   *
   * Testa o comportamento do sistema ao receber dados errados.
   * É importante validar que a mensagem de erro seja clara e informativa ao usuário.
   */
  test('should display an error for invalid credentials', async ({ page }) => {
    // Passa credenciais inválidas explicitamente para a função de login
    await login(page, 'invalid_user', 'wrong_password');

    // O sistema deve exibir um container de erro com a mensagem específica
    // `toContainText` verifica se o texto está presente — não precisa ser exato
    await expect(page.locator('.error-message-container')).toContainText(
      'Username and password do not match any user in this service'
    );
  });

  /**
   * Teste 3: Usuário bloqueado deve exibir mensagem específica de bloqueio.
   *
   * O Swag Labs possui um usuário especial `locked_out_user` para simular
   * um cenário de conta bloqueada — útil para testar este caso de uso
   * sem precisar bloquear uma conta real.
   *
   * A mensagem de erro deve ser diferente da de credenciais inválidas,
   * informando ao usuário o motivo específico do bloqueio.
   */
  test('should show locked out message for locked user', async ({ page }) => {
    // Usa credencial válida mas de usuário bloqueado
    await login(page, 'locked_out_user', 'secret_sauce');

    await expect(page.locator('.error-message-container')).toContainText(
      'Sorry, this user has been locked out.'
    );
  });

  /**
   * Teste 4: Logout deve redirecionar de volta para a página de login.
   *
   * Valida o fluxo completo de saída da aplicação:
   * 1. Login → 2. Abrir menu lateral → 3. Clicar em Logout → 4. Voltar ao login
   *
   * Testar o logout é importante para garantir que a sessão é encerrada
   * e o usuário retorna ao estado inicial.
   */
  test('should logout from inventory and return to login page', async ({ page }) => {
    await login(page);

    // Abre o menu hambúrguer (menu lateral de navegação)
    // Usa seletor por ID — IDs são únicos na página, boa escolha para elementos fixos
    await page.click('#react-burger-menu-btn');

    // Clica no link de logout dentro do menu aberto
    await page.click('#logout_sidebar_link');

    // Após logout, deve voltar para a raiz do site (página de login)
    await expect(page).toHaveURL('/');

    // O campo de username deve estar visível, confirmando que voltamos à tela de login
    await expect(page.locator('[data-test="username"]')).toBeVisible();
  });
});
