import { describe, expect, it } from "vitest";
import { formatAmount, formatCents, parseAmountToCents } from "./currency";

describe("parseAmountToCents", () => {
  it("parses whole and fractional major units to cents", () => {
    expect(parseAmountToCents("12")).toBe(1200);
    expect(parseAmountToCents("12.3")).toBe(1230);
    expect(parseAmountToCents("12.34")).toBe(1234);
    expect(parseAmountToCents("  0.05 ")).toBe(5);
  });

  it("rejects non-positive, malformed, or over-precise amounts", () => {
    expect(parseAmountToCents("0")).toBeNull();
    expect(parseAmountToCents("-1")).toBeNull();
    expect(parseAmountToCents("12.345")).toBeNull();
    expect(parseAmountToCents("1,000")).toBeNull();
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents("")).toBeNull();
  });
});

describe("formatAmount / formatCents", () => {
  it("renders cents as two-decimal major units", () => {
    expect(formatAmount(1234)).toBe("12.34");
    expect(formatAmount(5)).toBe("0.05");
  });

  it("prefixes the currency code", () => {
    expect(formatCents(1234, "USD")).toBe("USD 12.34");
  });
});
