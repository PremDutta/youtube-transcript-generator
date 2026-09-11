import { describe, it, expect } from "vitest";
import { formatTimestamp } from "./format";

describe("formatTimestamp", () => {
  it("formats seconds under a minute as mm:ss", () => {
    expect(formatTimestamp(5)).toBe("00:05");
  });

  it("formats minutes and seconds", () => {
    expect(formatTimestamp(125)).toBe("02:05");
  });

  it("omits the hours component under an hour", () => {
    expect(formatTimestamp(3599)).toBe("59:59");
  });

  it("includes hours once past 3600 seconds", () => {
    expect(formatTimestamp(3661)).toBe("01:01:01");
  });

  it("formats zero as 00:00", () => {
    expect(formatTimestamp(0)).toBe("00:00");
  });
});
