js_path = r"e:\web development\study antigravity\js\app.js"

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

# Search for common powershell snippets
suspicious = ["$path", "$request", "$listener", "-eq", "-or"]
for s in suspicious:
    if s in code:
        print(f"FOUND SUSPICIOUS STRING '{s}' in js/app.js!")
        # Print lines containing it
        lines = code.split("\n")
        for idx, line in enumerate(lines):
            if s in line:
                print(f"  Line {idx+1}: {line}")
    else:
        pass

print("Search complete.")
