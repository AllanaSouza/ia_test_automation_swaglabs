import { FullConfig, FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MetricsItem {
  file: string;
  project: string;
  title: string;
  status: string;
  duration: number;
}

export default class MetricsReporter implements Reporter {
  private items: MetricsItem[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    this.items.push({
      file: test.location.file,
      project: result.project?.name ?? 'unknown',
      title: test.title,
      status: result.status,
      duration: result.duration ?? 0,
    });
  }

  onEnd(result: FullResult) {
    const reportDir = join(process.cwd(), 'playwright-report');
    mkdirSync(reportDir, { recursive: true });

    const total = this.items.length;
    const passed = this.items.filter((item) => item.status === 'passed').length;
    const failed = this.items.filter((item) => item.status === 'failed').length;
    const skipped = this.items.filter((item) => item.status === 'skipped').length;
    const flaky = this.items.filter((item) => item.status === 'flaky').length;
    const timedOut = this.items.filter((item) => item.status === 'timedOut').length;
    const durationMs = this.items.reduce((acc, item) => acc + item.duration, 0);
    const avgDuration = total ? durationMs / total : 0;
    const passRate = total ? (passed / total) * 100 : 0;

    const countsByFile = this.items.reduce((map, item) => {
      const key = item.file;
      const current = map.get(key) ?? { total: 0, passed: 0, failed: 0, skipped: 0 };
      current.total += 1;
      if (item.status === 'passed') current.passed += 1;
      if (item.status === 'failed') current.failed += 1;
      if (item.status === 'skipped') current.skipped += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { total: number; passed: number; failed: number; skipped: number }>());

    const fileRows = Array.from(countsByFile.entries())
      .map(
        ([file, counts]) =>
          `<tr><td>${file}</td><td>${counts.total}</td><td>${counts.passed}</td><td>${counts.failed}</td><td>${counts.skipped}</td></tr>`
      )
      .join('\n');

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

    writeFileSync(join(reportDir, 'metrics.html'), html, 'utf-8');
  }
}
