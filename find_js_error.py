import os

js_path = r"e:\web development\study antigravity\js\app.js"

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

stack = []
pairs = {')': '(', '}': '{', ']': '['}
lines = code.split("\n")

# Simple scanner to find mismatched brackets
# Keeping track of strings to ignore brackets inside quotes
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
                    print(f"ERROR: Extra closing '{c}' at line {line_idx+1}, col {char_idx+1}")
                else:
                    top_c, top_line, top_col = stack.pop()
                    if top_c != expected:
                        print(f"ERROR: Mismatched '{c}' at line {line_idx+1}, col {char_idx+1} (expected closing for '{top_c}' from line {top_line}, col {top_col})")
                        
        char_idx += 1

if stack:
    print("\nERROR: Mismatched / unclosed brackets left on stack:")
    for c, line, col in stack:
        print(f"  Unclosed '{c}' opened at line {line}, col {col}")
else:
    print("Brackets matching scan complete. No basic mismatched braces detected.")
