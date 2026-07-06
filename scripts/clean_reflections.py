from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "科辰资料" / "产品图片"


def backup(path: Path) -> None:
    backup_path = path.with_name(f"{path.stem}.original{path.suffix}")
    if not backup_path.exists():
        backup_path.write_bytes(path.read_bytes())


def save_png(image: Image.Image, path: Path) -> None:
    tmp = path.with_name(f"{path.stem}.tmp{path.suffix}")
    image.convert("RGBA").save(tmp, optimize=True)
    tmp.replace(path)


def feathered_rect(size, box, radius=0, feather=4):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    if radius:
        draw.rounded_rectangle(box, radius=radius, fill=255)
    else:
      draw.rectangle(box, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather))


def feathered_ellipse(size, box, feather=4):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather))


def glass_patch(size, top, bottom, seed=1, horizontal_lines=()):
    rng = Random(seed)
    patch = Image.new("RGBA", size, (0, 0, 0, 0))
    pixels = patch.load()
    width, height = size

    for y in range(height):
        t = y / max(1, height - 1)
        base = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(width):
            noise = rng.randint(-4, 4)
            sheen = 10 if (x / max(1, width - 1)) > 0.64 else 0
            pixels[x, y] = (
                max(0, min(255, base[0] + noise + sheen)),
                max(0, min(255, base[1] + noise + sheen)),
                max(0, min(255, base[2] + noise + sheen)),
                255,
            )

    draw = ImageDraw.Draw(patch, "RGBA")
    for y, alpha in horizontal_lines:
        draw.line((2, y, width - 3, y), fill=(130, 160, 154, alpha), width=1)
        draw.line((2, y + 2, width - 3, y + 2), fill=(8, 15, 18, 120), width=1)

    return patch


def paste_with_mask(image, patch, box, mask):
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    layer.paste(patch, box)
    image.alpha_composite(Image.composite(layer, Image.new("RGBA", image.size, (0, 0, 0, 0)), mask))


def clean_314(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    # Upper glass reflection: remove the hand/phone/body reflection while preserving a dark window.
    box = (65, 101, 94, 166)
    patch = glass_patch((box[2] - box[0], box[3] - box[1]), (28, 43, 40), (7, 14, 16), seed=314)
    mask = feathered_rect(image.size, box, radius=2, feather=2)
    paste_with_mask(image, patch, box, mask)

    # Darken the lower human-shaped reflection without losing the shelf lines.
    box = (65, 166, 95, 224)
    patch = glass_patch(
        (box[2] - box[0], box[3] - box[1]),
        (10, 22, 25),
        (4, 9, 12),
        seed=1314,
        horizontal_lines=((17, 90), (32, 75)),
    )
    mask = feathered_rect(image.size, box, radius=2, feather=2)
    paste_with_mask(image, patch, box, mask)
    save_png(image, path)


def clean_315(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    # The repeated request likely points to the adjacent 315 image. Its reflection is in the display window.
    box = (74, 48, 113, 78)
    patch = glass_patch((box[2] - box[0], box[3] - box[1]), (34, 39, 45), (11, 17, 24), seed=315)
    mask = feathered_rect(image.size, box, radius=2, feather=2)
    paste_with_mask(image, patch, box, mask)
    save_png(image, path)


def clean_316(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    # Oval door glass: replace the photographer reflection in the top half with dark glass.
    box = (185, 123, 228, 167)
    patch = glass_patch((box[2] - box[0], box[3] - box[1]), (19, 29, 30), (5, 11, 13), seed=316)
    mask = feathered_ellipse(image.size, box, feather=4)
    paste_with_mask(image, patch, box, mask)

    # Remove remaining bright hand/phone highlights near the center-right of the glass.
    box = (199, 145, 230, 181)
    patch = glass_patch((box[2] - box[0], box[3] - box[1]), (8, 15, 17), (3, 8, 10), seed=2316)
    mask = feathered_ellipse(image.size, box, feather=3)
    paste_with_mask(image, patch, box, mask)
    save_png(image, path)


def main():
    jobs = {
        "微信图片_20260630160903_314_2.png": clean_314,
        "微信图片_20260630160907_315_2.png": clean_315,
        "微信图片_20260630160914_316_2.png": clean_316,
    }

    for name, cleaner in jobs.items():
        path = IMG_DIR / name
        if not path.exists():
            raise FileNotFoundError(path)
        backup(path)
        cleaner(path)
        print(f"cleaned {path}")


if __name__ == "__main__":
    main()
