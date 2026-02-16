import {
  isInlineImageSource,
  isSupportedImageSource,
  normalizeImageSource,
  resolveImageSource,
} from "../../utils/image/source";

describe("image source utilities", () => {
  it("normalizes and supports data:image URLs", () => {
    const raw = "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUA";
    const normalized = normalizeImageSource(raw);

    expect(normalized).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA");
    expect(isSupportedImageSource(raw)).toBe(true);
    expect(isInlineImageSource(raw)).toBe(true);
    expect(resolveImageSource(raw)).toBe(normalized);
  });

  it("returns fallback when source is not a supported image URL", () => {
    const fallback = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";
    expect(resolveImageSource("not-a-valid-url", fallback)).toBe(fallback);
  });
});
