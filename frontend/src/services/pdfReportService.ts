import { jsPDF } from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import type { AuditResponseData, AuditApiMeta } from '../types/audit';
import type { ComparisonResult } from '../types/comparison';
import type { AiComparisonInsights } from '../types/ai';
import { calculateOverallHealth } from '../utils/healthCalculator';
import { extractHostname } from './scanHistoryService';

// Ensure autoTable plugin is registered on jsPDF constructor for ESM bundlers
try {
  applyPlugin(jsPDF);
} catch {
  // Plugin already applied
}

/**
 * Safely renders a table using autoTable across different ESM / bundler packaging formats.
 */
function renderTable(doc: jsPDF, options: any): void {
  try {
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(options);
    } else if (typeof autoTable === 'function') {
      autoTable(doc, options);
    } else if (typeof (autoTable as any)?.default === 'function') {
      (autoTable as any).default(doc, options);
    } else {
      console.warn('pdfReportService: autoTable renderer is not available.');
    }
  } catch (err) {
    console.error('pdfReportService: error during renderTable:', err);
  }
}

/**
 * Safely extracts the total page count of a jsPDF document.
 */
function getPageCount(doc: jsPDF): number {
  try {
    if (typeof (doc as any).getNumberOfPages === 'function') {
      return (doc as any).getNumberOfPages();
    }
    if (typeof (doc as any).internal?.getNumberOfPages === 'function') {
      return (doc as any).internal.getNumberOfPages();
    }
  } catch {
    // Fallback
  }
  return 1;
}

/**
 * Safely extracts the final Y coordinate after an autoTable render.
 */
function getFinalY(doc: jsPDF, fallback: number): number {
  const lastTable = (doc as any).lastAutoTable;
  if (lastTable && typeof lastTable.finalY === 'number' && !isNaN(lastTable.finalY)) {
    return lastTable.finalY;
  }
  return fallback;
}

/**
 * Sanitizes a string for safe use in downloaded filenames.
 */
export function sanitizeFilename(str: string): string {
  return (str || 'website')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates and downloads a clean, professional PDF Audit Report for a single website.
 */
export function generateAuditPdf(
  auditData: AuditResponseData,
  meta?: AuditApiMeta
): void {
  try {
    if (!auditData) {
      console.warn('generateAuditPdf: No audit data provided.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const targetUrl = auditData.finalUrl || auditData.url || 'https://target-website.com';
    const hostname = extractHostname(targetUrl);
    const health = calculateOverallHealth(auditData.scores || {});
    const scanDate = auditData.fetchTime ? new Date(auditData.fetchTime).toLocaleString() : new Date().toLocaleString();
    const device = (auditData.device || 'desktop').toUpperCase();
    const duration = meta?.analysisDurationMs ? `${(meta.analysisDurationMs / 1000).toFixed(2)}s` : 'N/A';

    // 1. Header Banner
    doc.setFillColor(18, 24, 38); // Dark navy header
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(16, 185, 129); // Emerald accent
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SMART WEB APPLICATION HEALTH MONITORING', 14, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Lighthouse Audit & Core Web Vitals Report', 14, 20);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Target URL: ${targetUrl}`, 14, 27);
    doc.text(`Generated: ${scanDate}  |  Device: ${device}  |  Scan Duration: ${duration}`, 14, 33);

    let currentY = 46;

    // 2. Overall Health Score Summary Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 28, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL WEBSITE HEALTH SCORE', 20, currentY + 9);

    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text(`${health.score} / 100`, 20, currentY + 20);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tier: ${health.tier.toUpperCase()}`, 80, currentY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(health.description || 'Audit score based on Google Lighthouse benchmarks.', 80, currentY + 21, { maxWidth: 110 });

    currentY += 36;

    // 3. Lighthouse Category Scores Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Lighthouse Category Scores', 14, currentY);
    currentY += 3;

    const scores = auditData.scores || {};
    const categoryRows = [
      ['Performance', `${scores.performance ?? 'N/A'} / 100`, 'Loading speed, interactivity responsiveness & visual stability.'],
      ['Accessibility', `${scores.accessibility ?? 'N/A'} / 100`, 'WCAG compliance, color contrast, keyboard navigation & ARIA.'],
      ['Best Practices', `${scores.bestPractices ?? 'N/A'} / 100`, 'Security headers, HTTPS protocol, console hygiene & modern web APIs.'],
      ['SEO', `${scores.seo ?? 'N/A'} / 100`, 'Search engine discoverability, meta tags, and mobile readiness.'],
    ];

    renderTable(doc, {
      startY: currentY,
      head: [['Category', 'Score', 'Evaluation Description']],
      body: categoryRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { fontStyle: 'bold', cellWidth: 30, halign: 'center' },
        2: { cellWidth: 117 },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = getFinalY(doc, currentY + 40) + 10;

    // 4. Core Web Vitals & Key Timings Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Core Web Vitals & Diagnostic Metrics', 14, currentY);
    currentY += 3;

    const metrics = auditData.metrics || {};
    const vitalsRows = [
      ['Largest Contentful Paint (LCP)', metrics.largestContentfulPaint?.displayValue || 'N/A', (metrics.largestContentfulPaint?.rating || 'info').toUpperCase(), '<= 2.5 s', 'Core Web Vital (Main load speed)'],
      ['Interaction to Next Paint (INP)', metrics.interactionToNextPaint?.displayValue || 'N/A', (metrics.interactionToNextPaint?.rating || 'info').toUpperCase(), '<= 200 ms', 'Core Web Vital (User responsiveness)'],
      ['Cumulative Layout Shift (CLS)', metrics.cumulativeLayoutShift?.displayValue || '0', (metrics.cumulativeLayoutShift?.rating || 'info').toUpperCase(), '<= 0.1', 'Core Web Vital (Visual stability)'],
      ['First Contentful Paint (FCP)', metrics.firstContentfulPaint?.displayValue || 'N/A', (metrics.firstContentfulPaint?.rating || 'info').toUpperCase(), '<= 1.8 s', 'Initial render duration'],
      ['Total Blocking Time (TBT)', metrics.totalBlockingTime?.displayValue || 'N/A', (metrics.totalBlockingTime?.rating || 'info').toUpperCase(), '<= 200 ms', 'Main thread task blockage'],
      ['Speed Index (SI)', metrics.speedIndex?.displayValue || 'N/A', (metrics.speedIndex?.rating || 'info').toUpperCase(), '<= 3.4 s', 'Visual population speed'],
    ];

    renderTable(doc, {
      startY: currentY,
      head: [['Metric', 'Value', 'Rating', 'Google Target', 'Description']],
      body: vitalsRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { fontStyle: 'bold', cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 52 },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = getFinalY(doc, currentY + 50) + 10;

    // 5. Smart Recommendations & High-Impact Opportunities
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('3. Smart Performance Recommendations', 14, currentY);
    currentY += 3;

    const topOpportunities = (auditData.opportunities || []).slice(0, 6);
    const oppRows = topOpportunities.length > 0
      ? topOpportunities.map((opp) => [
          opp.title || 'Optimization Opportunity',
          opp.displayValue || (opp.savingsMs ? `${opp.savingsMs} ms savings` : 'Recommended'),
          ((opp.description || '').replace(/\[Learn more\]\(.*?\)\.?/i, '').trim().substring(0, 140) || 'Optimization guideline') + '...',
        ])
      : [['No high-impact opportunities found.', 'N/A', 'Website is performing within optimal Google guidelines.']];

    renderTable(doc, {
      startY: currentY,
      head: [['Issue / Optimization Opportunity', 'Potential Savings', 'Remediation Note']],
      body: oppRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 82 },
      },
      margin: { left: 14, right: 14 },
    });

    // Footer on all pages
    const pageCount = getPageCount(doc);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Smart Web Application Health Monitoring  |  Report for ${hostname}  |  Page ${i} of ${pageCount}`,
        14,
        287
      );
    }

    // Trigger browser download
    const filename = `website-health-report-${sanitizeFilename(hostname)}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating Audit PDF:', error);
    throw error;
  }
}

/**
 * Generates and downloads a clean, professional Comparison PDF Report for two websites.
 */
export function generateComparisonPdf(
  comparison: ComparisonResult,
  aiInsights?: AiComparisonInsights | null
): void {
  try {
    if (!comparison || !comparison.siteA || !comparison.siteB) {
      console.warn('generateComparisonPdf: Incomplete comparison data.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const hostA = extractHostname(comparison.siteA.url || 'Site A');
    const hostB = extractHostname(comparison.siteB.url || 'Site B');

    // 1. Header Banner
    doc.setFillColor(18, 24, 38);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(16, 185, 129);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SMART WEB APPLICATION HEALTH MONITORING', 14, 12);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Website Performance & Health Comparison Report', 14, 20);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Comparing: [A] ${hostA} (${comparison.siteA.device || 'desktop'})  vs  [B] ${hostB} (${comparison.siteB.device || 'desktop'})`, 14, 27);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);

    let currentY = 46;

    // 2. Winner Announcement Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 26, 3, 3, 'FD');

    const winnerLabel =
      comparison.winner === 'A'
        ? `Website A (${hostA}) is the Overall Better Website!`
        : comparison.winner === 'B'
        ? `Website B (${hostB}) is the Overall Better Website!`
        : 'Both Websites are Tied in Overall Performance!';

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPARISON VERDICT', 20, currentY + 8);

    doc.setFontSize(13);
    doc.setTextColor(16, 185, 129);
    doc.text(winnerLabel, 20, currentY + 16);

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(comparison.winnerReason || 'Benchmark analysis concluded.', 20, currentY + 22, { maxWidth: 170 });

    currentY += 34;

    // 3. Side-by-Side Metrics Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Head-to-Head Metric Comparison', 14, currentY);
    currentY += 3;

    const tableRows = (comparison.metrics || []).map((m) => [
      m.name || 'Metric',
      m.displayA || 'N/A',
      m.displayB || 'N/A',
      m.winner === 'A' ? `Site A (${hostA})` : m.winner === 'B' ? `Site B (${hostB})` : 'Tie',
      m.diffText || 'Identical',
    ]);

    renderTable(doc, {
      startY: currentY,
      head: [['Metric', `[A] ${hostA}`, `[B] ${hostB}`, 'Advantage', 'Difference']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 55 },
        1: { fontStyle: 'bold', cellWidth: 30, halign: 'center' },
        2: { fontStyle: 'bold', cellWidth: 30, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 32, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = getFinalY(doc, currentY + 60) + 10;

    // 4. Comparison Insights
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Key Automated Comparison Insights', 14, currentY);
    currentY += 4;

    const insightRows = (comparison.insights || []).length > 0
      ? (comparison.insights || []).map((ins, i) => [
          `#${i + 1}`,
          (ins.category || 'General').toUpperCase(),
          ins.text || '',
        ])
      : [['#1', 'GENERAL', 'Both sites evaluated under equal Google Lighthouse conditions.']];

    renderTable(doc, {
      startY: currentY,
      head: [['#', 'Category', 'Observation & Analysis']],
      body: insightRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { fontStyle: 'bold', cellWidth: 35 },
        2: { cellWidth: 135 },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = getFinalY(doc, currentY + 40) + 12;

    // 5. Append AI Competitor Advisor Findings (if available)
    if (aiInsights) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      // AI Header Banner
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(67, 56, 202); // indigo-700
      doc.text('AI Competitor Gap Analyzer & Improvement Advisor', 14, currentY);
      currentY += 5;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Analysis Provider: ${aiInsights.meta.provider.toUpperCase()} (${aiInsights.meta.model || 'Gemini 2.5'})  |  Target Improvement Site: ${aiInsights.verdict.weakerUrl}`,
        14,
        currentY
      );
      currentY += 8;

      // Smart Fix Priority Matrix Table
      if (aiInsights.priorityMatrix && aiInsights.priorityMatrix.length > 0) {
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Smart Fix Priority Matrix', 14, currentY);
        currentY += 4;

        const matrixRows = aiInsights.priorityMatrix.map((item) => [
          item.priority,
          item.issue,
          item.recommendedFix,
          item.difficulty,
          item.expectedBenefit,
        ]);

        renderTable(doc, {
          startY: currentY,
          head: [['Priority', 'Detected Issue', 'Recommended Fix', 'Difficulty', 'Expected Benefit']],
          body: matrixRows,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
          bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 22, halign: 'center' },
            1: { cellWidth: 48 },
            2: { cellWidth: 62 },
            3: { cellWidth: 22, halign: 'center' },
            4: { cellWidth: 28, halign: 'center' },
          },
          margin: { left: 14, right: 14 },
        });

        currentY = getFinalY(doc, currentY + 40) + 10;
      }

      // Adaptive Website Improvement Planner
      const plan = aiInsights.adaptivePlan;
      if (plan && plan.tasks && plan.tasks.length > 0) {
        if (currentY > 210) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Adaptive Website Improvement Planner', 14, currentY);
        currentY += 4.5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Total Estimated Effort: ${plan.totalEstimatedHoursFormatted}  |  Identified Tasks: ${plan.totalTasks}  |  Quick Wins: ${plan.quickWinsCount}  |  Critical Fixes: ${plan.criticalCount}`,
          14,
          currentY
        );
        currentY += 6;

        const plannerRows = plan.tasks.map((task) => [
          task.priority,
          task.problem,
          task.solution,
          `${task.effortTier}\n(${task.estimatedMinutes}m / ${task.difficulty})`,
          task.verificationMethod || 'Lighthouse re-audit'
        ]);

        renderTable(doc, {
          startY: currentY,
          head: [['Priority', 'Detected Problem', 'Recommended Solution', 'Effort & Difficulty', 'Verification Method']],
          body: plannerRows,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 20, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 58 },
            3: { cellWidth: 28, halign: 'center' },
            4: { cellWidth: 26 },
          },
          margin: { left: 14, right: 14 },
        });

        currentY = getFinalY(doc, currentY + 40) + 8;
      } else if (aiInsights.roadmap && aiInsights.roadmap.length > 0) {
        if (currentY > 210) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Adaptive Website Improvement Planner', 14, currentY);
        currentY += 4;

        const roadmapRows: string[][] = [];
        aiInsights.roadmap.forEach((stage) => {
          (stage.tasks || []).forEach((t, tIdx) => {
            roadmapRows.push([
              tIdx === 0 ? `Stage ${stage.day}` : '',
              stage.focusArea,
              t.task,
              t.detail || ''
            ]);
          });
        });

        renderTable(doc, {
          startY: currentY,
          head: [['Phase', 'Focus Area', 'Remediation Task', 'Implementation Detail']],
          body: roadmapRows,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
          bodyStyles: { fontSize: 7.8, textColor: [51, 65, 85] },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 18, halign: 'center' },
            1: { cellWidth: 32 },
            2: { fontStyle: 'bold', cellWidth: 55 },
            3: { cellWidth: 77 },
          },
          margin: { left: 14, right: 14 },
        });

        currentY = getFinalY(doc, currentY + 40) + 8;
      }

      // Disclaimer
      if (currentY > 265) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Note: Expected benefits and score gains are estimated diagnostic projections based on Google Lighthouse models and do not represent verified production guarantees until measured.',
        14,
        currentY + 4
      );
    }

    // Footer on all pages
    const pageCount = getPageCount(doc);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Smart Web Application Health Monitoring  |  Comparison: ${hostA} vs ${hostB}  |  Page ${i} of ${pageCount}`,
        14,
        287
      );
    }

    const filename = `website-comparison-${sanitizeFilename(hostA)}-vs-${sanitizeFilename(hostB)}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating Comparison PDF:', error);
    throw error;
  }
}
