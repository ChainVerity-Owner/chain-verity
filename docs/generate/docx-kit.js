// Shared Word-document toolkit for the Chain Verity handoff docs.
//
// Both generators use this so Chain-Verity-Technical-Brief.docx and
// Chain-Verity-MVP-Build-Plan.docx read as a matched set.
//
// Geometry: US Letter (12240 x 15840 DXA) with 1" margins → 9360 DXA of content
// width. Every table's columnWidths must sum to exactly CONTENT, and each cell
// repeats its own width — docx-js needs both or tables render inconsistently.

const {
  Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, WidthType, ShadingType, BorderStyle, LevelFormat, AlignmentType,
} = require("docx");

const CONTENT = 9360;

const INK = "0E1520";
const MUTED = "5B6B87";
const ACCENT = "1246A0";
const RISK = "B3261E";
const OK = "0B7A55";
const WARN = "B98900";

const HAIRLINE = { style: BorderStyle.SINGLE, size: 1, color: "C9D1DF" };
const CELL_BORDERS = { top: HAIRLINE, bottom: HAIRLINE, left: HAIRLINE, right: HAIRLINE };
const CELL_MARGINS = { top: 90, bottom: 90, left: 130, right: 130 };

/** Build TextRuns from a string or [{t, b, i, mono, color}] spec. */
const runs = (content) =>
  (Array.isArray(content) ? content : [{ t: content }]).map(
    (r) =>
      new TextRun({
        text: r.t,
        bold: !!r.b,
        italics: !!r.i,
        font: r.mono ? "Consolas" : undefined,
        size: r.mono ? 20 : undefined,
        color: r.color || undefined,
      })
  );

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });

const P = (c, opts = {}) =>
  new Paragraph({ children: runs(c), spacing: { after: opts.after ?? 140 }, ...opts.p });

const BULLET = (c) =>
  new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: runs(c), spacing: { after: 70 } });

const NUM = (c) =>
  new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: runs(c), spacing: { after: 90 } });

const QUOTE = (c) =>
  new Paragraph({
    children: runs(c),
    indent: { left: 340 },
    spacing: { after: 170, before: 60 },
    border: { left: { style: BorderStyle.SINGLE, size: 10, color: "C3CFE4", space: 10 } },
  });

const GAP = (after = 180) => new Paragraph({ children: [new TextRun("")], spacing: { after } });

/** Monospace shaded block for trees, SQL and shell commands. */
function CODE(lines, size = 17) {
  return lines.map((line, i) =>
    new Paragraph({
      children: [new TextRun({ text: line || " ", font: "Consolas", size, color: "23324A" })],
      shading: { fill: "F1F4FA", type: ShadingType.CLEAR },
      spacing: { after: i === lines.length - 1 ? 170 : 0, before: i === 0 ? 40 : 0 },
      indent: { left: 170 },
    })
  );
}

/** Bordered + shaded callout. Colour carries meaning across both documents:
 *  ACCENT = design call, WARN = caution, OK = recommendation, RISK = hazard. */
function CALLOUT(list, fill = "FFF4F2", border = RISK) {
  return new Paragraph({
    children: runs(list),
    shading: { fill, type: ShadingType.CLEAR },
    border: {
      left: { style: BorderStyle.SINGLE, size: 18, color: border, space: 8 },
      top: { style: BorderStyle.SINGLE, size: 2, color: "E3E8F1", space: 6 },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "E3E8F1", space: 6 },
      right: { style: BorderStyle.SINGLE, size: 2, color: "E3E8F1", space: 6 },
    },
    spacing: { after: 200, before: 60 },
  });
}

/** Zebra-striped table. Cells accept a string, a run spec, or an array of them. */
function TABLE(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  if (total !== CONTENT) throw new Error(`columnWidths sum ${total} != ${CONTENT}`);

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        borders: CELL_BORDERS,
        margins: CELL_MARGINS,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: "E9EEF7", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: "2B3A55" })] })],
      })
    ),
  });

  const bodyRows = rows.map((cells, ri) =>
    new TableRow({
      children: cells.map((c, i) => {
        const parts = Array.isArray(c) ? c : [typeof c === "string" ? { t: c } : c];
        return new TableCell({
          borders: CELL_BORDERS,
          margins: CELL_MARGINS,
          width: { size: widths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 ? "FAFBFE" : "FFFFFF", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              children: parts.map(
                (p) =>
                  new TextRun({
                    text: p.t,
                    bold: !!p.b,
                    italics: !!p.i,
                    font: p.mono ? "Consolas" : undefined,
                    size: p.mono ? 18 : 20,
                    color: p.color || INK,
                  })
              ),
            }),
          ],
        });
      }),
    })
  );

  return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: widths, rows: [headerRow, ...bodyRows] });
}

/** Shared style + numbering definitions. Heading IDs must be exactly
 *  "Heading1"/"Heading2" to override Word's built-ins; outlineLevel drives the
 *  navigation pane. */
const STYLES = {
  default: { document: { run: { font: "Calibri", size: 21, color: INK } } },
  paragraphStyles: [
    {
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 30, bold: true, color: INK, font: "Calibri" },
      paragraph: {
        spacing: { before: 340, after: 150 },
        outlineLevel: 0,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D6DEEC", space: 5 } },
      },
    },
    {
      id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 24, bold: true, color: "27364F", font: "Calibri" },
      paragraph: { spacing: { before: 240, after: 110 }, outlineLevel: 1 },
    },
    {
      id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 22, bold: true, color: MUTED, font: "Calibri" },
      paragraph: { spacing: { before: 180, after: 90 }, outlineLevel: 2 },
    },
  ],
};

const NUMBERING = {
  config: [
    {
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }],
    },
    {
      reference: "numbers",
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }],
    },
  ],
};

const PAGE = {
  size: { width: 12240, height: 15840 },
  margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
};

module.exports = {
  CONTENT, INK, MUTED, ACCENT, RISK, OK, WARN,
  runs, H1, H2, P, BULLET, NUM, QUOTE, GAP, CODE, CALLOUT, TABLE,
  STYLES, NUMBERING, PAGE,
};
