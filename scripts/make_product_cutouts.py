from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "科辰资料" / "产品图片"
OUTPUT_DIR = ROOT / "assets" / "product-cutouts"

FILES = [
    ("微信图片_20260630160848_312_2.png", "product-312.png"),
    ("微信图片_20260630160859_313_2.png", "product-313.png"),
    ("微信图片_20260630160903_314_2.png", "product-314.png"),
    ("微信图片_20260630160907_315_2.png", "product-315.png"),
    ("微信图片_20260630160914_316_2.png", "product-316.png"),
    ("微信图片_20260630160918_317_2.png", "product-317.png"),
    ("微信图片_20260630160930_319_2.png", "product-319.png"),
    ("微信图片_20260630160941_320_2.png", "product-320.png"),
    ("微信图片_20260630160945_321_2.png", "product-321.png"),
    ("微信图片_20260630160949_322_2.png", "product-322.png"),
]


def is_background(pixel):
    r, g, b, a = pixel
    if a < 12:
        return True
    # White/light gray backdrop, including mild shadows near the floor.
    if r > 236 and g > 236 and b > 236:
        return True
    if r > 222 and g > 222 and b > 222 and max(r, g, b) - min(r, g, b) < 12:
        return True
    return False


def edge_connected_background(image):
    width, height = image.size
    pixels = image.load()
    seen = set()
    queue = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < width and 0 <= y < height):
            continue
        if not is_background(pixels[x, y]):
            continue
        seen.add((x, y))
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return seen


def make_cutout(source, output):
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    bg = edge_connected_background(image)

    alpha = Image.new("L", image.size, 255)
    alpha_pixels = alpha.load()
    for x, y in bg:
        alpha_pixels[x, y] = 0

    # Smooth jagged edges while keeping the equipment body opaque.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))
    image.putalpha(alpha)

    bbox = image.getbbox()
    if bbox:
        pad = 10
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(width, bbox[2] + pad)
        bottom = min(height, bbox[3] + pad)
        image = image.crop((left, top, right, bottom))

    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, optimize=True)
    print(f"wrote {output.relative_to(ROOT)}")


def main():
    for source_name, output_name in FILES:
        source = SOURCE_DIR / source_name
        if not source.exists():
            raise FileNotFoundError(source)
        make_cutout(source, OUTPUT_DIR / output_name)


if __name__ == "__main__":
    main()
