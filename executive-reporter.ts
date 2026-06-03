/**
 * metrics-reporter.ts
 *
 * Reporter customizado do Playwright para geração de relatório executivo.
 *
 * Gera um arquivo HTML completo em playwright-report/metrics.html com:
 * - Cards de resumo (total, passou, falhou, ignorado, taxa de aprovação)
 * - Linha do tempo da execução
 * - Tabela detalhada por arquivo com status de cada teste
 * - Seção de bugs documentados (testes que verificam comportamentos conhecidos)
 * - Seção de falhas com detalhes
 *
 * Documentação sobre reporters customizados:
 * https://playwright.dev/docs/api/class-reporter
 */

import {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface MetricsItem {
  file: string;
  project: string;
  title: string;
  suiteName: string;
  status: string;
  duration: number;
  errors: string[];
}

export default class MetricsReporter implements Reporter {
  private items: MetricsItem[] = [];
  private startTime: number = Date.now();

  onTestEnd(test: TestCase, result: TestResult) {
    const errors = result.errors?.map((e) =>
      (e.message ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;').split('\n').slice(0, 6).join('\n')
    ) ?? [];

    this.items.push({
      file: test.location.file,
      project: test.titlePath()[0] ?? 'unknown',
      title: test.title,
      suiteName: test.parent?.title ?? '',
      status: result.status,
      duration: result.duration ?? 0,
      errors,
    });
  }

  onEnd(result: FullResult) {
    const reportDir = join(process.cwd(), 'playwright-report');
    mkdirSync(reportDir, { recursive: true });

    const total     = this.items.length;
    const passed    = this.items.filter((i) => i.status === 'passed').length;
    const failed    = this.items.filter((i) => i.status === 'failed').length;
    const skipped   = this.items.filter((i) => i.status === 'skipped').length;
    const flaky     = this.items.filter((i) => i.status === 'flaky').length;
    const timedOut  = this.items.filter((i) => i.status === 'timedOut').length;
    const durationMs = this.items.reduce((acc, i) => acc + i.duration, 0);
    const avgDuration = total ? durationMs / total : 0;
    const passRate  = total ? (passed / total) * 100 : 0;

    // Identifica testes que documentam bugs conhecidos (pelo título)
    const bugDocs = this.items.filter((i) => i.title.toLowerCase().includes('documenta bug'));

    // Falhas reais (excluindo testes de documentação de bugs)
    const realFailures = this.items.filter(
      (i) => i.status === 'failed' && !i.title.toLowerCase().includes('documenta bug')
    );

    // Agrupa por arquivo
    const byFile = this.items.reduce((map, item) => {
      const key = item.file.split(/[\\/]/).pop() ?? item.file;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
      return map;
    }, new Map<string, MetricsItem[]>());

    const statusIcon = (s: string) => {
      if (s === 'passed')   return '✅';
      if (s === 'failed')   return '❌';
      if (s === 'skipped')  return '⏭️';
      if (s === 'timedOut') return '⏱️';
      if (s === 'flaky')    return '⚠️';
      return '❓';
    };

    const statusClass = (s: string) => {
      if (s === 'passed')   return 'status-pass';
      if (s === 'failed')   return 'status-fail';
      if (s === 'skipped')  return 'status-skip';
      if (s === 'timedOut') return 'status-timeout';
      return 'status-other';
    };

    // Seção: tabelas por arquivo
    const fileSections = Array.from(byFile.entries()).map(([fileName, tests]) => {
      const fp = tests.filter((t) => t.status === 'passed').length;
      const ff = tests.filter((t) => t.status === 'failed').length;
      const fileRate = tests.length ? (fp / tests.length) * 100 : 0;

      const rows = tests.map((t) => `
        <tr class="${statusClass(t.status)}">
          <td>${statusIcon(t.status)}</td>
          <td class="test-title">${t.title}</td>
          <td><span class="badge ${statusClass(t.status)}">${t.status}</span></td>
          <td class="duration">${t.duration}ms</td>
        </tr>`).join('');

      return `
        <div class="file-section">
          <div class="file-header">
            <span class="file-name">📄 ${fileName}</span>
            <span class="file-stats">${fp}/${tests.length} passaram &nbsp;|&nbsp; ${fileRate.toFixed(0)}%</span>
          </div>
          <table class="test-table">
            <thead><tr><th></th><th>Teste</th><th>Status</th><th>Duração</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    // Seção: bugs documentados
    const bugRows = bugDocs.length > 0
      ? bugDocs.map((b) => `
        <tr>
          <td>🐛</td>
          <td class="test-title">${b.title}</td>
          <td>${b.file.split(/[\\/]/).pop()}</td>
          <td><span class="badge status-doc">documentado</span></td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="empty-row">Nenhum bug documentado nesta execução.</td></tr>';

    // Seção: falhas reais
    const failureRows = realFailures.length > 0
      ? realFailures.map((f) => `
        <div class="failure-item">
          <div class="failure-header">❌ <strong>${f.title}</strong> &nbsp;<span class="dim">${f.file.split(/[\\/]/).pop()}</span></div>
          ${f.errors.length > 0 ? `<pre class="error-detail">${f.errors.join('\n')}</pre>` : ''}
        </div>`).join('')
      : '<p class="no-failures">✅ Nenhuma falha real encontrada nesta execução.</p>';

    const overallStatus = result.status === 'passed' ? '✅ APROVADO' : '❌ COM FALHAS';
    const overallClass  = result.status === 'passed' ? 'status-pass' : 'status-fail';

    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório Executivo de Testes — Swag Labs</title>
  <style>
    :root {
      --pass:    #0f766e;
      --fail:    #b91c1c;
      --skip:    #b45309;
      --timeout: #7c3aed;
      --doc:     #1d4ed8;
      --bg:      #f1f5f9;
      --card:    #ffffff;
      --border:  #e2e8f0;
      --text:    #1e293b;
      --dim:     #64748b;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 32px 24px;
      font-size: 14px;
    }

    /* ── HEADER ── */
    .report-header {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f5c8a 100%);
      color: white;
      border-radius: 16px;
      padding: 32px 36px;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }
    .report-header h1 { font-size: 1.6rem; margin-bottom: 6px; }
    .report-header .subtitle { opacity: 0.75; font-size: 0.9rem; }
    .overall-badge {
      font-size: 1.1rem;
      font-weight: bold;
      padding: 10px 24px;
      border-radius: 50px;
      border: 2px solid rgba(255,255,255,0.4);
      background: rgba(255,255,255,0.12);
    }

    /* ── CARDS ── */
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .card {
      background: var(--card);
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-top: 4px solid var(--border);
    }
    .card.c-pass   { border-color: var(--pass); }
    .card.c-fail   { border-color: var(--fail); }
    .card.c-skip   { border-color: var(--skip); }
    .card.c-rate   { border-color: #6366f1; }
    .card.c-time   { border-color: #0ea5e9; }
    .card.c-avg    { border-color: #8b5cf6; }

    .card-value {
      font-size: 2.2rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 6px;
    }
    .card.c-pass .card-value { color: var(--pass); }
    .card.c-fail .card-value { color: var(--fail); }
    .card.c-skip .card-value { color: var(--skip); }
    .card.c-rate .card-value { color: #6366f1; }
    .card.c-time .card-value { color: #0ea5e9; }
    .card.c-avg  .card-value { color: #8b5cf6; }
    .card-label { color: var(--dim); font-size: 0.8rem; text-transform: uppercase; letter-spacing: .04em; }

    /* ── PROGRESS BAR ── */
    .progress-section {
      background: var(--card);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .progress-section h2 { margin-bottom: 12px; font-size: 1rem; }
    .progress-bar-bg {
      background: #e2e8f0;
      border-radius: 999px;
      height: 12px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--pass), #34d399);
      transition: width 0.6s ease;
    }
    .progress-legend {
      display: flex;
      gap: 20px;
      margin-top: 10px;
      font-size: 0.8rem;
      color: var(--dim);
    }

    /* ── SECTIONS ── */
    .section { margin-bottom: 36px; }
    .section h2 {
      font-size: 1.1rem;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
    }

    /* ── FILE SECTIONS ── */
    .file-section {
      background: var(--card);
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .file-header {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      background: #f8fafc;
      border-bottom: 1px solid var(--border);
      font-weight: 600;
    }
    .file-name { color: var(--text); }
    .file-stats { color: var(--dim); font-size: 0.85rem; }

    /* ── TEST TABLE ── */
    .test-table { width: 100%; border-collapse: collapse; }
    .test-table th {
      text-align: left;
      padding: 10px 16px;
      background: #f8fafc;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--dim);
      letter-spacing: .05em;
    }
    .test-table td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .test-table tr:last-child td { border-bottom: none; }
    .test-title { font-weight: 500; }
    .duration { color: var(--dim); font-size: 0.85rem; text-align: right; }

    /* ── BADGES ── */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-pass   { background: #dcfce7; color: var(--pass); }
    .status-fail   { background: #fee2e2; color: var(--fail); }
    .status-skip   { background: #fef3c7; color: var(--skip); }
    .status-timeout{ background: #ede9fe; color: var(--timeout); }
    .status-doc    { background: #dbeafe; color: var(--doc); }
    .status-other  { background: #f1f5f9; color: var(--dim); }

    /* ── BUGS TABLE ── */
    .bugs-table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .bugs-table th { text-align: left; padding: 12px 16px; background: #eff6ff; font-size: 0.75rem; text-transform: uppercase; color: var(--doc); letter-spacing: .05em; }
    .bugs-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    .bugs-table tr:last-child td { border-bottom: none; }

    /* ── FAILURES ── */
    .failure-item { background: var(--card); border-left: 4px solid var(--fail); border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .failure-header { margin-bottom: 8px; }
    .error-detail { background: #fef2f2; border-radius: 6px; padding: 12px; font-size: 0.78rem; white-space: pre-wrap; color: #7f1d1d; overflow-x: auto; }
    .no-failures { color: var(--pass); font-weight: 600; padding: 16px 0; }
    .empty-row { text-align: center; color: var(--dim); padding: 16px; }

    /* ── MISC ── */
    .dim { color: var(--dim); }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .info-item { background: var(--card); border-radius: 10px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .info-label { font-size: 0.75rem; text-transform: uppercase; color: var(--dim); margin-bottom: 4px; letter-spacing: .04em; }
    .info-value { font-weight: 600; font-size: 0.95rem; }
    .footer { margin-top: 40px; text-align: center; color: var(--dim); font-size: 0.8rem; padding-top: 20px; border-top: 1px solid var(--border); }
  </style>
</head>
<body>

  <!-- ══ HEADER ══ -->
  <div class="report-header">
    <div>
      <h1>📊 Relatório Executivo de Testes</h1>
      <div class="subtitle">Swag Labs (saucedemo.com) &nbsp;·&nbsp; Automação com Playwright + TypeScript</div>
      <div class="subtitle" style="margin-top:6px">Gerado em: ${now}</div>
    </div>
    <div class="overall-badge ${overallClass}">${overallStatus}</div>
  </div>

  <!-- ══ CARDS DE RESUMO ══ -->
  <div class="cards">
    <div class="card c-pass">
      <div class="card-value">${passed}</div>
      <div class="card-label">Passaram</div>
    </div>
    <div class="card c-fail">
      <div class="card-value">${failed}</div>
      <div class="card-label">Falharam</div>
    </div>
    <div class="card c-skip">
      <div class="card-value">${skipped}</div>
      <div class="card-label">Ignorados</div>
    </div>
    <div class="card">
      <div class="card-value" style="color:#1e293b">${total}</div>
      <div class="card-label">Total</div>
    </div>
    <div class="card c-rate">
      <div class="card-value">${passRate.toFixed(1)}%</div>
      <div class="card-label">Taxa de aprovação</div>
    </div>
    <div class="card c-time">
      <div class="card-value">${(durationMs / 1000).toFixed(1)}s</div>
      <div class="card-label">Duração total</div>
    </div>
    <div class="card c-avg">
      <div class="card-value">${avgDuration.toFixed(0)}ms</div>
      <div class="card-label">Média por teste</div>
    </div>
  </div>

  <!-- ══ BARRA DE PROGRESSO ══ -->
  <div class="progress-section">
    <h2>Taxa de aprovação geral</h2>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" style="width: ${passRate.toFixed(1)}%"></div>
    </div>
    <div class="progress-legend">
      <span>✅ ${passed} passaram</span>
      ${failed  > 0 ? `<span>❌ ${failed} falharam</span>` : ''}
      ${skipped > 0 ? `<span>⏭️ ${skipped} ignorados</span>` : ''}
      ${timedOut > 0 ? `<span>⏱️ ${timedOut} timeout</span>` : ''}
      ${flaky   > 0 ? `<span>⚠️ ${flaky} instáveis</span>` : ''}
    </div>
  </div>

  <!-- ══ INFORMAÇÕES DA EXECUÇÃO ══ -->
  <div class="section">
    <h2>⚙️ Informações da Execução</h2>
    <div class="info-grid">
      <div class="info-item"><div class="info-label">Aplicação testada</div><div class="info-value">Swag Labs — saucedemo.com</div></div>
      <div class="info-item"><div class="info-label">Framework</div><div class="info-value">Playwright + TypeScript</div></div>
      <div class="info-item"><div class="info-label">Browser</div><div class="info-value">Chromium (Desktop)</div></div>
      <div class="info-item"><div class="info-label">Status geral</div><div class="info-value ${overallClass}">${result.status.toUpperCase()}</div></div>
      <div class="info-item"><div class="info-label">Bugs documentados</div><div class="info-value" style="color:var(--doc)">${bugDocs.length} bugs conhecidos</div></div>
      <div class="info-item"><div class="info-label">Arquivos testados</div><div class="info-value">${byFile.size} spec files</div></div>
    </div>
  </div>

  <!-- ══ RESULTADOS POR ARQUIVO ══ -->
  <div class="section">
    <h2>📁 Resultados por Arquivo</h2>
    ${fileSections}
  </div>

  <!-- ══ BUGS DOCUMENTADOS ══ -->
  <div class="section">
    <h2>🐛 Bugs Documentados (Comportamentos Conhecidos)</h2>
    <p style="color:var(--dim); font-size:0.85rem; margin-bottom:16px">
      Estes testes verificam que bugs conhecidos do sistema ainda existem.
      Eles passam quando o bug está presente — e falhariam se o bug fosse corrigido, sinalizando que o teste precisa ser atualizado.
    </p>
    <table class="bugs-table">
      <thead><tr><th></th><th>Teste</th><th>Arquivo</th><th>Status</th></tr></thead>
      <tbody>${bugRows}</tbody>
    </table>
  </div>

  <!-- ══ FALHAS REAIS ══ -->
  <div class="section">
    <h2>❌ Falhas Reais</h2>
    ${failureRows}
  </div>

  <div class="footer">
    Relatório gerado automaticamente pelo MetricsReporter &nbsp;·&nbsp; Swag Labs Automation Suite &nbsp;·&nbsp; ${now}
  </div>

</body>
</html>`;

    writeFileSync(join(reportDir, 'metrics.html'), html, 'utf-8');
  }
}
