import type { DesignGoals, SearchCandidate } from './types.ts';

export interface DesignReportInput {
  generatedAt: string;
  goals: DesignGoals;
  design: SearchCandidate;
  material: {
    name: string;
    lossRange: string;
    preparation: string;
    difficulty: string;
    rank: number;
    total: number;
    sourceUrl: string;
  };
  explanation: string;
  provenance?: { ncut: number; ng: number; modelVersion: string };
}

function pdfSafe(value: string | number): string {
  return String(value)
    .replaceAll('₀', '0')
    .replaceAll('₁', '1')
    .replaceAll('₂', '2')
    .replaceAll('₃', '3')
    .replaceAll('₄', '4')
    .replaceAll('≤', '<=')
    .replaceAll('×', 'x')
    .replaceAll('–', '-')
    .replaceAll('—', '-');
}

function fixed(value: number, digits: number): string {
  return value.toFixed(digits);
}

export function designReportFilename(generatedAt: string): string {
  return `qubit-studio-design-${generatedAt.slice(0, 10)}.pdf`;
}

export async function buildDesignReportPdf(input: DesignReportInput): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const blue: [number, number, number] = [23, 105, 210];
  const ink: [number, number, number] = [23, 32, 51];
  const muted: [number, number, number] = [100, 112, 133];
  const line: [number, number, number] = [219, 226, 236];
  const pale: [number, number, number] = [237, 244, 255];

  const text = (value: string | number, x: number, y: number, options?: Parameters<typeof doc.text>[3]) => {
    doc.text(pdfSafe(value), x, y, options);
  };
  const card = (x: number, y: number, width: number, height: number, fill?: [number, number, number]) => {
    doc.setDrawColor(...line);
    if (fill) {
      doc.setFillColor(...fill);
      doc.roundedRect(x, y, width, height, 7, 7, 'FD');
    } else {
      doc.roundedRect(x, y, width, height, 7, 7, 'S');
    }
  };
  const reportRow = (label: string, value: string, x: number, y: number, width: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    text(label, x, y);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...ink);
    text(value, x + width, y, { align: 'right' });
  };

  doc.setTextColor(...blue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  text('QUBIT STUDIO', margin, 48);
  doc.setTextColor(...ink);
  doc.setFontSize(25);
  text('Design report', margin, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  text(`Generated ${new Date(input.generatedAt).toLocaleString()}`, margin, 92);

  doc.setFillColor(234, 247, 240);
  doc.roundedRect(pageWidth - margin - 108, 47, 108, 25, 12, 12, 'F');
  doc.setTextColor(25, 116, 72);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  text('PASSES ALL GOALS', pageWidth - margin - 54, 63, { align: 'center' });

  doc.setDrawColor(...ink);
  doc.setLineWidth(1.3);
  doc.line(margin, 108, pageWidth - margin, 108);

  const goalGap = 8;
  const goalWidth = (contentWidth - goalGap * 2) / 3;
  const goalValues = [
    ['Operating frequency', `${fixed(input.goals.target_ghz, 2)} GHz`],
    ['Minimum level separation', `${fixed(input.goals.min_anharmonicity_mhz, 0)} MHz`],
    ['Maximum charge sensitivity', `${fixed(input.goals.max_dispersion_khz, 2)} kHz`],
  ];
  goalValues.forEach(([label, value], index) => {
    const x = margin + index * (goalWidth + goalGap);
    card(x, 126, goalWidth, 57, pale);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    text(label, x + 10, 144);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...blue);
    text(value, x + 10, 168);
  });

  const columnGap = 12;
  const columnWidth = (contentWidth - columnGap) / 2;
  const columnY = 199;
  const columnHeight = 173;
  card(margin, columnY, columnWidth, columnHeight);
  card(margin + columnWidth + columnGap, columnY, columnWidth, columnHeight);

  const sectionTitle = (title: string, x: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...ink);
    text(title, x + 13, columnY + 22);
  };
  sectionTitle('Electrical design', margin);
  sectionTitle('Material choice', margin + columnWidth + columnGap);

  const leftX = margin + 13;
  const rightX = margin + columnWidth + columnGap + 13;
  const rowWidth = columnWidth - 26;
  reportRow('EJ / EC', `${fixed(input.design.ej_ghz, 3)} / ${fixed(input.design.ec_ghz, 3)} GHz`, leftX, 243, rowWidth);
  reportRow('Operating frequency', `${fixed(input.design.f01_ghz, 3)} GHz`, leftX, 270, rowWidth);
  reportRow('Level separation', `${fixed(input.design.anharmonicity_mhz, 1)} MHz`, leftX, 297, rowWidth);
  reportRow('Charge sensitivity', `<= ${fixed(input.design.dispersion_upper_khz, 3)} kHz`, leftX, 324, rowWidth);
  reportRow('EJ / EC ratio', fixed(input.design.ratio, 1), leftX, 351, rowWidth);

  reportRow('Combination', input.material.name, rightX, 243, rowWidth);
  reportRow('List rank', `#${input.material.rank} of ${input.material.total}`, rightX, 270, rowWidth);
  reportRow('Measured energy loss', input.material.lossRange, rightX, 297, rowWidth);
  reportRow('Preparation', input.material.preparation, rightX, 324, rowWidth);
  reportRow('Difficulty', input.material.difficulty, rightX, 351, rowWidth);

  card(margin, 388, contentWidth, 105, [248, 250, 253]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...blue);
  text('WHY THIS DESIGN?', margin + 14, 409);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...ink);
  const explanationLines = doc.splitTextToSize(pdfSafe(input.explanation), contentWidth - 28) as string[];
  doc.text(explanationLines.slice(0, 5), margin + 14, 430, { lineHeightFactor: 1.45 });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ink);
  text('Scope and limitations', margin, 523);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  const scope = 'This is a simplified isolated-transmon calculation paired with published resonator material measurements. It is a comparison and teaching aid, not a fabricated-device prediction or coherence estimate.';
  doc.text(doc.splitTextToSize(scope, contentWidth), margin, 540, { lineHeightFactor: 1.4 });

  doc.setTextColor(...blue);
  doc.setFontSize(8);
  if (input.provenance) text(`Producing model ${input.provenance.modelVersion}; ng ${input.provenance.ng}; ncut ${input.provenance.ncut}`, margin, 575);
  text('Material data source', margin, 596);
  doc.link(margin, 586, 88, 15, { url: input.material.sourceUrl });

  doc.setDrawColor(...line);
  doc.line(margin, 615, pageWidth - margin, 615);
  doc.setTextColor(...muted);
  doc.setFontSize(7.5);
  text('Qubit Studio  /  isolated-transmon model  /  one-page design summary', margin, 632);

  return new Uint8Array(doc.output('arraybuffer'));
}
