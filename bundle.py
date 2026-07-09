import os

# Paths
base_dir = r"e:\web development\study antigravity"
index_path = os.path.join(base_dir, "index.html")
out_path = os.path.join(base_dir, "studysync_apps_script.html")

# Read index.html
with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

# Map local libraries back to CDN links for standalone Apps Script execution
html = html.replace('<link rel="stylesheet" href="./css/all.min.css">', '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">')
html = html.replace('<script src="./js/lib/gsap.min.js"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>')
html = html.replace('<script src="./js/lib/lottie.min.js"></script>', '<script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>')
html = html.replace('<script src="./js/lib/chart.js"></script>', '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>')

# Replace css files
css_files = ["variables.css", "main.css", "components.css", "pages.css"]
for css in css_files:
    css_path = os.path.join(base_dir, "css", css)
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            css_content = f.read()
        
        # Use standard string replace to avoid regex escaping bugs
        target_tag = f'<link rel="stylesheet" href="./css/{css}">'
        html = html.replace(target_tag, f"<style>\n{css_content}\n</style>")

# Replace app.js
js_path = os.path.join(base_dir, "js", "app.js")
if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()
    
    target_tag = '<script src="./js/app.js"></script>'
    html = html.replace(target_tag, f"<script>\n{js_content}\n</script>")

# Save output
with open(out_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Bundled successfully!")
