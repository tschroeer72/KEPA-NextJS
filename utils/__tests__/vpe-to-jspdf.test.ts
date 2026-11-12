/**
 * @jest-environment node
 */
import { VpeToJsPdf, TextAlignment, PenStyle } from "../vpe-to-jspdf";
import { jsPDF } from "jspdf";

jest.mock("jspdf-autotable", () => ({}));
jest.mock("jspdf", () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    setLineWidth: jest.fn(),
    setLineDashPattern: jest.fn(),
    addPage: jest.fn(),
    text: jest.fn(),
    rect: jest.fn(),
    line: jest.fn(),
    addImage: jest.fn(),
    output: jest.fn(() => new Uint8Array([1, 2, 3]).buffer),
  })),
}));

let v: VpeToJsPdf;
let doc: any;

beforeEach(() => {
  jest.clearAllMocks();
  v = new VpeToJsPdf();
  doc = v.doc;
});

describe("constructor", () => {
  it("creates portrait A4 in mm by default", () => {
    expect(jsPDF).toHaveBeenCalledWith({ orientation: "p", unit: "mm", format: "a4" });
  });

  it("supports landscape", () => {
    new VpeToJsPdf("l");
    expect(jsPDF).toHaveBeenLastCalledWith({ orientation: "l", unit: "mm", format: "a4" });
  });

  it("has sensible defaults", () => {
    expect(v.cm).toBe(10);
    expect(v.alignment).toBe(TextAlignment.Left);
    expect(v.penStyle).toBe(PenStyle.Solid);
    expect(v.currentFontName).toBe("helvetica");
    expect(v.currentFontSize).toBe(12);
  });
});

describe("setMargins", () => {
  it("stores margins in cm and converts right/bottom to page coordinates", () => {
    v.setMargins(2, 3, 1.5, 2.5);
    expect(v.nLeftMargin).toBe(2);
    expect(v.nTopMargin).toBe(3);
    expect(v.nRightMargin).toBeCloseTo(21 - 1.5);
    expect(v.nBottomMargin).toBeCloseTo(29.7 - 2.5);
    expect([v.nLeft, v.nTop, v.nRight, v.nBottom]).toEqual([2, 3, 2, 3]);
  });
});

describe("fonts", () => {
  it("maps arial to helvetica and applies size", () => {
    v.selectFont("Arial", 14);
    expect(v.currentFontName).toBe("helvetica");
    expect(v.currentFontSize).toBe(14);
    expect(doc.setFont).toHaveBeenCalledWith("helvetica", "normal");
    expect(doc.setFontSize).toHaveBeenCalledWith(14);
  });

  it("lowercases other font names", () => {
    v.selectFont("Times", 10);
    expect(v.currentFontName).toBe("times");
  });

  it.each([
    [false, false, "normal"],
    [true, false, "bold"],
    [false, true, "italic"],
    [true, true, "bolditalic"],
  ])("setFontAttr bold=%s italic=%s -> %s", (bold, italic, style) => {
    v.setFontAttr(TextAlignment.Right, bold, italic, true, true);
    expect(v.alignment).toBe(TextAlignment.Right);
    expect(v.currentFontStyle).toBe(style);
    expect(doc.setFont).toHaveBeenCalledWith("helvetica", style);
  });

  it("keeps the style when the font is selected afterwards", () => {
    v.setFontAttr(TextAlignment.Left, true, false, false, false);
    v.selectFont("Arial", 9);
    expect(doc.setFont).toHaveBeenLastCalledWith("helvetica", "bold");
  });
});

describe("pageBreak", () => {
  it("adds a page and resets nBottom to top margin", () => {
    v.setMargins(1, 2, 1, 1);
    v.nBottom = 20;
    v.pageBreak();
    expect(doc.addPage).toHaveBeenCalledTimes(1);
    expect(v.nBottom).toBe(2);
  });
});

describe("write", () => {
  beforeEach(() => v.selectFont("Arial", 10));

  it("left aligned: converts cm box (x,y,right,bottom) to mm and centers vertically", () => {
    v.write(1, 2, 5, 3, "Hallo");
    const textHeight = 10 * 0.3527;
    const expectedY = 20 + 10 / 2 + textHeight / 3;
    expect(doc.text).toHaveBeenCalledWith("Hallo", 10, expectedY, { align: "left", maxWidth: 40 });
    expect([v.nLeft, v.nTop, v.nRight, v.nBottom]).toEqual([1, 2, 5, 3]);
  });

  it("centers text at the box middle", () => {
    v.setFontAttr(TextAlignment.Center, false, false, false, false);
    v.write(1, 2, 5, 3, "C");
    expect(doc.text.mock.calls[0][1]).toBe(10 + 40 / 2);
    expect(doc.text.mock.calls[0][3].align).toBe("center");
  });

  it("right aligns text at the box edge", () => {
    v.setFontAttr(TextAlignment.Right, false, false, false, false);
    v.write(1, 2, 5, 3, "R");
    expect(doc.text.mock.calls[0][1]).toBe(10 + 40);
  });

  it("negative w/h are treated as width/height", () => {
    v.write(1, 2, -4, -1, "N");
    expect(doc.text.mock.calls[0][3].maxWidth).toBe(40);
    expect([v.nLeft, v.nTop, v.nRight, v.nBottom]).toEqual([1, 2, 5, 3]);
  });
});

describe("box / line", () => {
  it("box draws a rect with pen settings and updates position", () => {
    v.penSize = 0.5;
    v.box(1, 1, 4, 3);
    expect(doc.setLineWidth).toHaveBeenCalledWith(0.5);
    expect(doc.setLineDashPattern).toHaveBeenCalledWith([], 0);
    expect(doc.rect).toHaveBeenCalledWith(10, 10, 30, 20);
    expect([v.nLeft, v.nTop, v.nRight, v.nBottom]).toEqual([1, 1, 4, 3]);
  });

  it("box with negative size", () => {
    v.box(1, 1, -2, -1);
    expect(doc.rect).toHaveBeenCalledWith(10, 10, 20, 10);
    expect([v.nRight, v.nBottom]).toEqual([3, 2]);
  });

  it("line converts cm to mm and updates position", () => {
    v.line(1, 2, 3, 4);
    expect(doc.line).toHaveBeenCalledWith(10, 20, 30, 40);
    expect([v.nLeft, v.nTop, v.nRight, v.nBottom]).toEqual([1, 2, 3, 4]);
  });

  it.each([
    [PenStyle.Dash, [2, 2]],
    [PenStyle.DashDot, [2, 1, 0.5, 1]],
    [PenStyle.DashDotDot, [2, 1, 0.5, 0.5, 0.5, 1]],
    [PenStyle.Solid, []],
  ])("pen style %s sets dash pattern", (style, pattern) => {
    v.penStyle = style;
    v.line(0, 0, 1, 1);
    expect(doc.setLineDashPattern).toHaveBeenCalledWith(pattern, 0);
  });
});

describe("writeBox", () => {
  it("draws a solid box then text and restores the pen style", () => {
    v.penStyle = PenStyle.Dash;
    v.writeBox(1, 1, 4, 3, "Box");
    expect(doc.setLineDashPattern).toHaveBeenCalledWith([], 0);
    expect(doc.rect).toHaveBeenCalledWith(10, 10, 30, 20);
    expect(doc.text).toHaveBeenCalledWith("Box", 10, expect.any(Number), expect.any(Object));
    expect(v.penStyle).toBe(PenStyle.Dash);
    expect(doc.rect.mock.invocationCallOrder[0]).toBeLessThan(doc.text.mock.invocationCallOrder[0]);
  });
});

describe("image", () => {
  it("adds image with defaults", () => {
    v.image(1, 1, 3, 2, "data");
    expect(doc.addImage).toHaveBeenCalledWith("data", "JPEG", 10, 10, 20, 10, undefined, "FAST", undefined);
    expect([v.nLeft, v.nTop, v.nRight, v.nBottom]).toEqual([1, 1, 3, 2]);
  });

  it("passes explicit format/alias/compression/rotation and handles negative size", () => {
    v.image(1, 1, -3, -2, "d", "PNG", "al", "SLOW", 90);
    expect(doc.addImage).toHaveBeenCalledWith("d", "PNG", 10, 10, 30, 20, "al", "SLOW", 90);
    expect([v.nRight, v.nBottom]).toEqual([4, 3]);
  });
});

describe("storePos / restorePos", () => {
  it("restores the stored coordinates", () => {
    v.line(1, 2, 3, 4);
    v.storePos();
    v.line(5, 6, 7, 8);
    v.restorePos();
    expect([v.nLeft, v.nTop, v.nRight, v.nBottom]).toEqual([1, 2, 3, 4]);
  });
});

describe("getOutput", () => {
  it("returns a Uint8Array of the arraybuffer output", () => {
    const out = v.getOutput();
    expect(doc.output).toHaveBeenCalledWith("arraybuffer");
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out)).toEqual([1, 2, 3]);
  });
});
