#!/usr/bin/env python3
"""
Themis Package Builder (Standalone)
Tạo cấu trúc thư mục Themis: MABAI/test01/MABAI.INP, MABAI.OUT ...
"""

import sys
import os
import zipfile
import json

def build_themis_zip(problem_json_path: str, output_zip_path: str):
    with open(problem_json_path, "r", encoding="utf-8") as f:
        prob = json.load(f)
        
    code = prob.get("problemCode", "BAI1").upper().strip()
    test_cases = prob.get("testCases", [])
    
    with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for idx, tc in enumerate(test_cases, 1):
            folder_num = f"test{idx:02d}"
            inp_path = f"{code}/{folder_num}/{code}.INP"
            out_path = f"{code}/{folder_num}/{code}.OUT"
            
            zf.writestr(inp_path, tc.get("input", ""))
            zf.writestr(out_path, tc.get("output", ""))
            
        # Thêm file solution.cpp
        if prob.get("solutionCpp"):
            zf.writestr(f"{code}/solution.cpp", prob["solutionCpp"])
            
        # Thêm file problem.md
        md_content = f"# {prob.get('title', '')}\n\n## Đề bài\n{prob.get('description', '')}\n"
        zf.writestr(f"{code}/problem.md", md_content)
        
    print(f"Đã đóng gói thành công gói Themis: {output_zip_path}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        build_themis_zip(sys.argv[1], sys.argv[2])
    else:
        print("Sử dụng: python package_themis.py <problem.json> <output.zip>")
