import os

html_path = r"e:\web development\study antigravity\studysync_apps_script.html"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Extract script block
start_tag = "<script>"
end_tag = "</script>"

start_idx = html.find(start_tag)
end_idx = html.rfind(end_tag)

if start_idx == -1 or end_idx == -1:
    print("ERROR: Script block not found in HTML.")
    exit()

js_code = html[start_idx + len(start_tag):end_idx]
lines = js_code.split("\n")

stack = []
pairs = {')': '(', '}': '{', ']': '['}

in_string = False
string_char = None
escaped = False

for line_idx, line in enumerate(lines):
    char_idx = 0
    while char_idx < len(line):
        c = line[char_idx]
        
        if escaped:
            escaped = False
            char_idx += 1
            continue
            
        if c == '\\':
            escaped = True
            char_idx += 1
            continue
            
        if in_string:
            if c == string_char:
                in_string = False
                string_char = None
        else:
            if c in ['"', "'", '`']:
                in_string = True
                string_char = c
            elif c in ['(', '{', '[']:
                stack.append((c, line_idx + 1, char_idx + 1))
            elif c in [')', '}', ']']:
                expected = pairs[c]
                if not stack:
                    print(f"ERROR: Extra closing '{c}' at JS line {line_idx+1}, col {char_idx+1}: {line}")
                else:
                    top_c, top_line, top_col = stack.pop()
                    if top_c != expected:
                        print(f"ERROR: Mismatched '{c}' at JS line {line_idx+1}, col {char_idx+1} (expected '{top_c}' from line {top_line}, col {top_col}): {line}")
                        
        char_idx += 1

if stack:
    print(f"\nERROR: Mismatched / unclosed brackets left on stack: {len(stack)}")
    for c, line, col in stack[:10]:
        print(f"  Unclosed '{c}' opened at JS line {line}, col {col}")
else:
    print("Bundled Javascript block bracket matching scan complete. No mismatched braces detected.")
