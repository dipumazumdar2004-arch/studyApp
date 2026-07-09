import os

html_path = r"e:\web development\study antigravity\studysync_apps_script.html"

with open(html_path, "r", encoding="utf-8") as f:
    code = f.read()

lines = code.split("\n")
found = False

for idx, line in enumerate(lines):
    if "fetch(" in line or "fetchYoutubeMetadata" in line:
        found = True
        print(f"--- Line {idx+1} ---")
        start = max(0, idx - 5)
        end = min(len(lines), idx + 6)
        for i in range(start, end):
            prefix = ">> " if i == idx else "   "
            print(f"{prefix}{i+1}: {lines[i]}")
            
if not found:
    print("Could not find fetch( or fetchYoutubeMetadata in the bundled HTML file.")
