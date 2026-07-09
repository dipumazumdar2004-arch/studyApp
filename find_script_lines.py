import os

html_path = r"e:\web development\study antigravity\studysync_apps_script.html"

with open(html_path, "r", encoding="utf-8") as f:
    code = f.read()

lines = code.split("\n")

script_start_idx = -1
for idx, line in enumerate(lines):
    if "<script>" in line:
        script_start_idx = idx
        break

if script_start_idx == -1:
    print("Could not find <script> tag.")
else:
    print(f"<script> starts at line {script_start_idx+1}")
    print("--- User JavaScript block line 130 to 170 ---")
    # Javascript lines are offset by script_start_idx + 1 (since line 1 of script is script_start_idx + 2)
    start_line = script_start_idx + 130
    end_line = script_start_idx + 171
    
    for i in range(start_line, min(end_line, len(lines))):
        script_line_num = i - script_start_idx
        print(f"JS Line {script_line_num} (HTML Line {i+1}): {lines[i]}")
