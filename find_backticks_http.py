js_path = r"e:\web development\study antigravity\js\app.js"

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

lines = code.split("\n")
print("--- Backticks with HTTP/double-slash found ---")
for idx, line in enumerate(lines):
    if "`" in line and ("http" in line or "//" in line):
        print(f"Line {idx+1}: {line}")

print("Search complete.")
