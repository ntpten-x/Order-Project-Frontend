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
    expect(resolveImageSource("not-a-valid-url", fallback)).toBe(normalizeImageSource(fallback));
  });

  it("normalizes malformed base64 padding and whitespace in data urls", () => {
    const raw = "data:image/jpeg;base64, /9j/4AAQSkZJRgABAQAAAQABAAD===";
    const normalized = normalizeImageSource(raw);

    expect(normalized).toBe("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD=");
    expect(isSupportedImageSource(raw)).toBe(true);
    expect(resolveImageSource(raw)).toBe(normalized);
  });

  it("rejects invalid data image payloads before rendering", () => {
    const raw = "data:image/jpeg;base64,%%%%";
    expect(normalizeImageSource(raw)).toBe("");
    expect(isSupportedImageSource(raw)).toBe(false);
    expect(resolveImageSource(raw)).toBeNull();
  });

  it("extracts direct image URL from google imgres links", () => {
    const raw =
      "https://www.google.com/imgres?q=%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B8%A7%E0%B8%9C%E0%B8%B1%E0%B8%94&imgurl=https%3A%2F%2Fimg.wongnai.com%2Fp%2F1920x0%2F2019%2F12%2F19%2Fd5537700a7274ac09964b6a51dd0a9f6.jpg&imgrefurl=https%3A%2F%2Fwww.wongnai.com%2Frecipes%2Fegg-fried-rice";

    expect(normalizeImageSource(raw)).toBe(
      "https://img.wongnai.com/p/1920x0/2019/12/19/d5537700a7274ac09964b6a51dd0a9f6.jpg"
    );
  });
});
