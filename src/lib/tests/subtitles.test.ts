import { describe, it, expect } from "vitest";
import { parseSRT } from "../subtitles";

describe("parseSRT", () => {
  it("returns empty array for empty content", () => {
    expect(parseSRT("")).toEqual([]);
    expect(parseSRT("   ")).toEqual([]);
  });

  it("correctly parses a single basic subtitle block", () => {
    const srt = `1
00:00:01,000 --> 00:00:04,500
Hello World!`;
    const result = parseSRT(srt);
    expect(result.length).toBe(1);
    expect(result[0].startTime).toBe(1.0);
    expect(result[0].endTime).toBe(4.5);
    expect(result[0].text).toBe("Hello World!");
  });

  it("correctly parses multiple subtitle blocks", () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
Hello World!

2
00:00:04,250 --> 00:00:07,100
This is a second caption.`;
    const result = parseSRT(srt);
    expect(result.length).toBe(2);
    expect(result[0].startTime).toBe(1.0);
    expect(result[0].endTime).toBe(3.0);
    expect(result[0].text).toBe("Hello World!");

    expect(result[1].startTime).toBe(4.25);
    expect(result[1].endTime).toBe(7.1);
    expect(result[1].text).toBe("This is a second caption.");
  });

  it("handles multi-line subtitles", () => {
    const srt = `1
00:01:15,123 --> 00:01:20,500
This is a multi-line
subtitle text.
Enjoy it!`;
    const result = parseSRT(srt);
    expect(result.length).toBe(1);
    expect(result[0].startTime).toBe(75.123);
    expect(result[0].endTime).toBe(80.5);
    expect(result[0].text).toBe("This is a multi-line\nsubtitle text.\nEnjoy it!");
  });

  it("handles alternative timestamp separators (dot instead of comma)", () => {
    const srt = `1
00:00:05.500 --> 00:00:08.200
Test dot timestamps.`;
    const result = parseSRT(srt);
    expect(result.length).toBe(1);
    expect(result[0].startTime).toBe(5.5);
    expect(result[0].endTime).toBe(8.2);
    expect(result[0].text).toBe("Test dot timestamps.");
  });

  it("handles Windows CRLF and trailing spaces", () => {
    const srt = "1\r\n00:00:02,000 --> 00:00:05,000\r\nWindows CRLF Test\r\n\r\n2\r\n00:00:06,000 --> 00:00:08,000\r\nSecond Line\r\n";
    const result = parseSRT(srt);
    expect(result.length).toBe(2);
    expect(result[0].text).toBe("Windows CRLF Test");
    expect(result[1].text).toBe("Second Line");
  });

  it("ignores blocks with invalid timestamps", () => {
    const srt = `1
invalid timestamp line
Some text

2
00:00:01,000 --> 00:00:03,000
Valid Subtitle`;
    const result = parseSRT(srt);
    expect(result.length).toBe(1);
    expect(result[0].text).toBe("Valid Subtitle");
  });
});
