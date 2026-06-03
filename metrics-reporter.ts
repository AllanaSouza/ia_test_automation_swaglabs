/**
 * metrics-reporter.ts
 *
 * Reporter customizado do Playwright para geração de métricas de execução.
 *
 * O Playwright permite criar reporters próprios implementando a interface `Reporter`.
 * Este reporter coleta dados de cada teste executado e, ao final, gera um arquivo
 * HTML com estatísticas visuais da suíte (metrics.html).
 *
 * Para que seja usado, precisa estar registrado no playwright.config.ts:
 *   reporter: [['./metrics-reporter.ts']]
 *
 * Documentação sobre reporters customizados:
 * https://playwright.dev/docs/api/class-reporter
 */

import {
  FullConfig,    // Configuração completa do Playwright (não usada aqui, mas disponível)
  FullResult,    // Resultado geral da execução (passed, failed, timedout)
  Reporter,      // Interface que este reporter implementa
  TestCase,      // Representa um teste individual (title, location, etc.)
  TestResult,    // Representa o resultado de uma execução de um teste
} from '@playwright/test/reporter';

import { mkdirSync, writeFileSync } from 'fs';   // Funções de escrita no sistema de arquivos
import { join } from 'path';                      // Utilitário para montar caminhos de arquivo

/**
 * Interface que define a estrutura de cada item de métrica coletado.
 * TypeScript usa interfaces para garantir que os objetos tenham a forma esperada.
 */
interface MetricsItem {
  file: string;      // Caminho do arquivo de teste
  project: string;   // Nome do projeto (ex: 'chromium')
  title: string;     // Título do teste
  status: string;    // Status: 'passed', 'failed', 'skipped', 'timedOut', 'flaky'
  duration: number;  // Duração em milissegundos
}

/**
 * Classe MetricsReporter — implementa a interface `Reporter` do Playwright.
 *
 * O Playwright chama os métodos desta classe automaticamente durante a execução:
 * - `onTestEnd()` é chamado após CADA teste terminar
 * - `onEnd()` é chamado UMA VEZ ao final de toda a suíte
 */
export default class MetricsReporter implements Reporter {

  // Array privado que acumula os dados de cada teste durante a execução
  // `private` impede acesso externo — encapsulamento de dados
  private items: MetricsItem[] = [];

  /**
   * Callback chamado pelo Playwright ao final de cada teste.
   * Aqui coletamos e armazenamos os dados relevantes do teste.
   *
   * @param test   - Metadados do teste (título, arquivo, etc.)
   * @param result - Resultado da execução (status, duração, etc.)
   */
  onTestEnd(test: TestCase, result: TestResult) {
    this.items.push({
      file: test.location.file,                  // Arquivo onde o teste está definido
      project: result.project?.name ?? 'unknown', // Nome do projeto (com fallback 'unknown')
      title: test.title,                          // Título do teste
      status: result.status,                      // Status final
      duration: result.duration ?? 0,             // Duração em ms (0 se undefined)
    });
  }

  /**
   * Callback chamado pelo Playwright uma única vez, após TODOS os testes terminarem.
   * Aqui calculamos as métricas agregadas e geramos o relatório HTML.
   *
   * @param result - Resultado geral da suíte (passed, failed, timedout)
   */
  onEnd(result: FullResult) {
    // Define o diretório de saída do relatório
    const reportDir = join(process.cwd(), 'playwright-report');

    // Cria o diretório se não existir (`recursive: true` não lança erro se já existir)
    mkdirSync(reportDir, { recursive: true });

    // --- Cálculo das métricas agregadas ---

    const total = this.items.length;

    // `filter()` retorna um novo array com apenas os itens que passam na condição
    const passed   = this.items.filter((item) => item.status === 'passed').length;
    const failed   = this.items.filter((item) => item.status === 'failed').length;
    const skipped  = this.items.filter((item) => item.status === 'skipped').length;
    const flaky    = this.items.filter((item) => item.status === 'flaky').length;    // Instável (passou em retry)
    const timedOut = this.items.filter((item) => item.status === 'timedOut').length;

    // Soma total de todas as durações em ms
    const durationMs = this.items.reduce((acc, item) => acc + item.duration, 0);

    // Média de duração por teste (evita divisão por zero)
    const avgDuration = total ? durationMs / total : 0;

    // Taxa de aprovação em percentual
    const passRate = total ? (passed / total) * 100 : 0;

    // --- Agrupamento de resultados por arquivo ---

    /**
     * `reduce()` transforma o array em um Map onde:
     * - Chave: caminho do arquivo
     * - Valor: contadores { total, passed, failed, skipped }
     *
     * Map é preferido sobre objetos simples quando as chaves são dinâmicas.
     */
    const countsByFile = this.items.reduce((map, item) => {
      const key = item.file;
      const current = map.get(key) ?? { total: 0, passed: 0, failed: 0, skipped: 0 };
      current.total += 1;
      if (item.status === 'passed')  current.passed += 1;
      if (item.status === 'failed')  current.failed += 1;
      if (item.status === 'skipped') current.skipped += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { total: number; passed: number; failed: number; skipped: number }>());

    // Gera as linhas HTML da tabela de detalhes por arquivo
    const fileRows = Array.from(countsByFile.entries())
      .map(
        ([file, counts]) =>
          `<tr><td>${file}</td><td>${counts.total}</td><td>${counts.passed}</td><td>${counts.failed}</td><td>${counts.skipped}</td></tr>`
      )
      .join('\n');

    // --- Geração do HTML do relatório ---

    /**
     * Template literal (crase) permite escrever HTML multi-linha com interpolação de variáveis.
     * As expressões `${...}` são substituídas pelos valores calculados acima.
     */
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório de Métricas - Sauce Demo</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; background: #f5f7fb; color: #1f2937; }
    h1, h2 { margin: 0 0 12px; }
    .header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .card { background: white; border-radius: 12px; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08); padding: 20px; flex: 1 1 220px; }
    .card strong { display: block; font-size: 2rem; margin-bottom: 6px; }
    .status-pass { color: #0f766e; }
    .status-fail { color: #b91c1c; }
    .status-skip { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
    th { background: #eef2ff; }
    .footer { margin-top: 24px; font-size: 0.95rem; color: #475569; }
  </style>
</head>
<body>
  <h1>Relatório de Métricas de Testes</h1>
  <div class="header">
    <div class="card">
      <strong>${total}</strong>
      Total de testes
    </div>
    <div class="card">
      <strong class="status-pass">${passed}</strong>
      Testes aprovados
    </div>
    <div class="card">
      <strong class="status-fail">${failed}</strong>
      Testes falhos
    </div>
    <div class="card">
      <strong class="status-skip">${skipped}</strong>
      Testes ignorados
    </div>
    <div class="card">
      <strong>${passRate.toFixed(2)}%</strong>
      Taxa de aprovação
    </div>
  </div>

  <h2>Resumo de execução</h2>
  <div class="card">
    <p>Duração total: ${Math.round(durationMs / 1000)}s</p>
    <p>Duração média por teste: ${avgDuration.toFixed(0)}ms</p>
    <p>Relatório gerado: ${new Date().toLocaleString('pt-BR')}</p>
    <p>Status geral: <strong>${result.status.toUpperCase()}</strong></p>
  </div>

  <h2>Detalhes por arquivo</h2>
  <table>
    <thead>
      <tr><th>Arquivo</th><th>Total</th><th>Passou</th><th>Falhou</th><th>Ignorado</th></tr>
    </thead>
    <tbody>
      ${fileRows}
    </tbody>
  </table>

  <div class="footer">
    <p>Este relatório foi gerado automaticamente pelo custom reporter de métricas.</p>
  </div>
</body>
</html>`;

    // Salva o HTML no arquivo metrics.html dentro da pasta playwright-report/
    // 'utf-8' define a codificação do arquivo — necessário para acentos e caracteres especiais
    writeFileSync(join(reportDir, 'metrics.html'), html, 'utf-8');
  }
}
