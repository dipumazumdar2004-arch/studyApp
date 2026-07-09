js_path = r"e:\web development\study antigravity\js\app.js"

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

lines = code.split("\n")
print(f"Total lines: {len(lines)}")
print("--- Lines 130 to 170 ---")
for i in range(129, min(170, len(lines))):
    print(f"{i+1}: {lines[i]}")
