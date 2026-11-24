import io
import json
import base64
import requests
from pathlib import Path
from PIL import Image, ImageDraw

BASE_URL = "http://127.0.0.1:8000"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEMO_DIR = PROJECT_ROOT / "demo_results"
IMAGES_DIR = DEMO_DIR / "images"
COMPARISONS_DIR = DEMO_DIR / "comparisons"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
COMPARISONS_DIR.mkdir(parents=True, exist_ok=True)

def b64_to_pil(b64_str: str) -> Image.Image:
    if "," in b64_str:
        b64_str = b64_str.split(",")[1]
    img_bytes = base64.b64decode(b64_str)
    return Image.open(io.BytesIO(img_bytes)).convert("RGB")

def pil_to_b64(img: Image.Image) -> str:
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG", quality=95)
    return f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

def create_composite(images_with_labels, output_path, title=None):
    n = len(images_with_labels)
    w, h = images_with_labels[0][0].size
    header_h = 50 if title else 0
    footer_h = 45
    composite = Image.new("RGB", (w * n, h + header_h + footer_h), (18, 19, 22))
    draw = ImageDraw.Draw(composite)
    if title:
        draw.text((20, 16), title, fill=(255, 255, 255))
    for i, (img, label) in enumerate(images_with_labels):
        if img.size != (w, h):
            img = img.resize((w, h), Image.Resampling.LANCZOS)
        composite.paste(img, (i * w, header_h))
        draw.rectangle([(i * w, header_h + h), ((i + 1) * w, header_h + h + footer_h)], fill=(28, 30, 36))
        draw.text((i * w + 12, header_h + h + 14), label, fill=(230, 235, 245))
    composite.save(output_path, quality=92)
    return composite

def main():
    print("--- Running Architectural Sketch Img2Img Demonstration ---")
    ref_path = IMAGES_DIR / "img2img_reference_input.jpg"
    ref_img = Image.open(ref_path).convert("RGB")
    ref_b64 = pil_to_b64(ref_img)

    prompt = "A photorealistic modern luxury villa made of raw concrete and warm cedar wood, surrounded by lush evergreen trees under golden hour sunlight, architectural photography, 8k"
    seed = 42

    composite_list = [(ref_img, "Architectural Sketch Input")]
    results = []

    for strength in [0.2, 0.6, 0.9]:
        print(f"Generating Img2Img at strength η = {strength}...")
        payload = {
            "prompt": prompt,
            "init_image": ref_b64,
            "strength": strength,
            "steps": 2,
            "seed": seed
        }
        res = requests.post(f"{BASE_URL}/api/generate", json=payload).json()
        out_img = b64_to_pil(res["image"])
        out_file = IMAGES_DIR / f"img2img_strength_{strength}.jpg"
        out_img.save(out_file, quality=92)

        desc = "Subtle Detail Tint" if strength == 0.2 else "Balanced Synthesis" if strength == 0.6 else "Complete Reimagination"
        composite_list.append((out_img, f"η = {strength} ({desc})"))
        results.append({
            "strength": strength,
            "clip_score": res["clip_score"],
            "caption": res["caption"],
            "time": res["generation_time"]
        })
        print(f"  -> Strength {strength}: Time = {res['generation_time']}s | CLIP = {res['clip_score']} | Caption = '{res['caption']}'")

    comp_path = COMPARISONS_DIR / "img2img_strength_comparison.png"
    create_composite(composite_list, comp_path, "Image-to-Image Generation across Denoising Strengths (η = 0.2, 0.6, 0.9)")
    print(f"Saved side-by-side comparison to {comp_path}")

    with open(DEMO_DIR / "img2img_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    main()
