#!/usr/bin/env python3
"""
Themis C++ Test Runner (Standalone)
Tự động biên dịch C++17 và chạy 20 test inputs qua stdin để sinh outputs chuẩn xác 100%.
"""

import sys
import os
import re
import subprocess
import tempfile
import time

def sanitize_cpp(code: str) -> str:
    """Tắt các lệnh freopen để có thể pipe qua stdin/stdout"""
    return re.sub(r'^\s*freopen\s*\([^;]+;', r'// [Auto-piped] \g<0>', code, flags=re.MULTILINE)

def compile_and_run(cpp_code: str, test_inputs: list) -> list:
    cleaned = sanitize_cpp(cpp_code)
    with tempfile.TemporaryDirectory() as tmpdir:
        src_file = os.path.join(tmpdir, "solution.cpp")
        bin_file = os.path.join(tmpdir, "solution.bin")
        
        with open(src_file, "w", encoding="utf-8") as f:
            f.write(cleaned)
            
        # Biên dịch g++ -O3 -std=c++17
        compile_cmd = ["g++", "-O3", "-std=c++17", src_file, "-o", bin_file]
        proc = subprocess.run(compile_cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            print(f"[LỖI BIÊN DỊCH C++]:\n{proc.stderr}", file=sys.stderr)
            return []
            
        outputs = []
        for idx, inp in enumerate(test_inputs):
            try:
                run_proc = subprocess.run(
                    [bin_file],
                    input=inp,
                    capture_output=True,
                    text=True,
                    timeout=2.0
                )
                outputs.append(run_proc.stdout.rstrip())
            except subprocess.TimeoutExpired:
                outputs.append("[TIMEOUT > 2.0s]")
            except Exception as e:
                outputs.append(f"[RUNTIME ERROR: {e}]")
                
        return outputs

if __name__ == "__main__":
    print("Themis C++ Runner module sẵn sàng.")
