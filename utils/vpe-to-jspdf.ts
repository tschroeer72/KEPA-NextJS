import { jsPDF } from "jspdf";
import "jspdf-autotable";

export enum TextAlignment {
  Left = "left",
  Center = "center",
  Right = "right"
}

export enum PenStyle {
  Solid = "solid",
  Dash = "dash",
  DashDot = "dashdot",
  DashDotDot = "dashdotdot"
}

export class VpeToJsPdf {
  public doc: jsPDF;
  public cm = 10; // jsPDF nutzt Millimeter standardmäßig, 1cm = 10mm
  public nLeftMargin = 0;
  public nTopMargin = 0;
  public nRightMargin = 0;
  public nBottomMargin = 0;

  // Platzhalter für die zuletzt gezeichneten Objektkoordinaten (in cm)
  public nLeft = 0;
  public nTop = 0;
  public nRight = 0;
  public nBottom = 0;

  public penSize = 0.2;
  public penStyle: PenStyle = PenStyle.Solid;
  public currentFontSize = 12;
  public currentFontName = "helvetica";
  public currentFontStyle = "normal";
  public alignment: TextAlignment = TextAlignment.Left;

  // Hilfsvariablen für Store/Restore
  private backup_nLeft = 0;
  private backup_nTop = 0;
  private backup_nRight = 0;
  private backup_nBottom = 0;

  constructor(orientation: "p" | "l" = "p") {
    this.doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: "a4"
    });
  }

  public setMargins(left: number, top: number, right: number, bottom: number): void {
    this.nLeftMargin = left;
    this.nTopMargin = top;
    const pageWidth = this.doc.internal.pageSize.getWidth() / this.cm;
    const pageHeight = this.doc.internal.pageSize.getHeight() / this.cm;
    this.nRightMargin = pageWidth - right;
    this.nBottomMargin = pageHeight - bottom;
    
    // Initialisiere nBottom auf nTopMargin für den Start
    this.nBottom = top;
  }

  public selectFont(fontName: string, size: number): void {
    this.currentFontName = fontName.toLowerCase() === "arial" ? "helvetica" : fontName.toLowerCase();
    this.currentFontSize = size;
    this.doc.setFont(this.currentFontName, this.currentFontStyle);
    this.doc.setFontSize(this.currentFontSize);
  }

  public setFontAttr(alignment: TextAlignment, bold: boolean, italic: boolean, underline: boolean, strikeout: boolean): void {
    this.alignment = alignment;
    let style = "";
    if (bold) style += "bold";
    if (italic) style += "italic";
    if (style === "") style = "normal";
    
    this.currentFontStyle = style;
    this.doc.setFont(this.currentFontName, this.currentFontStyle);
    
    // Unterstreichen wird in jsPDF anders gehandhabt, oft manuell oder via plugin. 
    // Wir lassen es hier der Einfachheit halber weg oder nutzen Text-Optionen wenn möglich.
  }

  public pageBreak(): void {
    this.doc.addPage();
    this.nBottom = this.nTopMargin;
  }

  public write(x: number, y: number, w: number, h: number, text: string): void {
    const X = x * this.cm;
    const Y = y * this.cm;
    const width = w < 0 ? Math.abs(w) * this.cm : w * this.cm;
    const height = h < 0 ? Math.abs(h) * this.cm : h * this.cm;

    const options: any = {
      align: this.alignment,
      maxWidth: width
    };

    // jsPDF's text() y is baseline, but VPE seems to use top.
    // Wir schätzen die vertikale Zentrierung
    const textHeight = this.currentFontSize * 0.3527; // pt to mm
    const middleY = Y + (height / 2) + (textHeight / 2) - 0.5;

    let textX = X;
    if (this.alignment === TextAlignment.Center) textX = X + width / 2;
    if (this.alignment === TextAlignment.Right) textX = X + width;

    this.doc.text(text, textX, middleY, options);

    const textWidth = this.doc.getTextWidth(text) / this.cm;

    this.nLeft = x;
    this.nTop = y;
    
    if (this.alignment === TextAlignment.Center) {
      this.nLeft = x + (width / 2 / this.cm) - (textWidth / 2);
      this.nRight = this.nLeft + textWidth;
    } else if (this.alignment === TextAlignment.Right) {
      this.nLeft = x + (width / this.cm) - textWidth;
      this.nRight = x + (width / this.cm);
    } else {
      this.nLeft = x;
      this.nRight = x + textWidth;
    }

    this.nBottom = h < 0 ? y + Math.abs(h) : y + h;
  }

  public writeBox(x: number, y: number, w: number, h: number, text: string): void {
    this.storePos();
    const prevPenStyle = this.penStyle;
    this.penStyle = PenStyle.Solid;
    this.box(x, y, w, h);
    this.penStyle = prevPenStyle;
    this.restorePos();
    this.write(x, y, w, h, text);
  }

  public box(x: number, y: number, w: number, h: number): void {
    const X = x * this.cm;
    const Y = y * this.cm;
    const width = w < 0 ? Math.abs(w) * this.cm : w * this.cm;
    const height = h < 0 ? Math.abs(h) * this.cm : h * this.cm;

    this.applyPenSettings();
    this.doc.rect(X, Y, width, height);

    this.nLeft = x;
    this.nTop = y;
    this.nRight = w < 0 ? x + Math.abs(w) : x + w;
    this.nBottom = h < 0 ? y + Math.abs(h) : y + h;
  }

  public line(x1: number, y1: number, x2: number, y2: number): void {
    const X1 = x1 * this.cm;
    const Y1 = y1 * this.cm;
    const X2 = x2 * this.cm;
    const Y2 = y2 * this.cm;

    this.applyPenSettings();
    this.doc.line(X1, Y1, X2, Y2);

    this.nLeft = x1;
    this.nTop = y1;
    this.nRight = x2;
    this.nBottom = y2;
  }

  private applyPenSettings(): void {
    this.doc.setLineWidth(this.penSize);
    // Dash styles
    if (this.penStyle === PenStyle.Dash) {
      this.doc.setLineDashPattern([2, 2], 0);
    } else if (this.penStyle === PenStyle.DashDot) {
      this.doc.setLineDashPattern([2, 1, 0.5, 1], 0);
    } else if (this.penStyle === PenStyle.DashDotDot) {
      this.doc.setLineDashPattern([2, 1, 0.5, 0.5, 0.5, 1], 0);
    } else {
      this.doc.setLineDashPattern([], 0);
    }
  }

  public storePos(): void {
    this.backup_nLeft = this.nLeft;
    this.backup_nTop = this.nTop;
    this.backup_nRight = this.nRight;
    this.backup_nBottom = this.nBottom;
  }

  public restorePos(): void {
    this.nLeft = this.backup_nLeft;
    this.nTop = this.backup_nTop;
    this.nRight = this.backup_nRight;
    this.nBottom = this.backup_nBottom;
  }

  public getOutput(): Uint8Array {
    return new Uint8Array(this.doc.output("arraybuffer"));
  }
}
