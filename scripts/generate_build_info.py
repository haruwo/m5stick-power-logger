#!/usr/bin/env python3
"""
Generate build information header file
"""

import datetime
import subprocess
import os

def get_git_info():
    try:
        commit = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode().strip()
        branch = subprocess.check_output(['git', 'rev-parse', '--abbrev-ref', 'HEAD']).decode().strip()
        return commit, branch
    except:
        return "unknown", "unknown"

def generate_build_info():
    commit, branch = get_git_info()
    build_time = datetime.datetime.now().isoformat()
    
    content = f"""
#ifndef BUILD_INFO_H
#define BUILD_INFO_H

#define BUILD_TIMESTAMP "{build_time}"
#define BUILD_COMMIT "{commit}"
#define BUILD_BRANCH "{branch}"

#endif // BUILD_INFO_H
"""
    
    os.makedirs('include', exist_ok=True)
    with open('include/build_info.h', 'w') as f:
        f.write(content)

if __name__ == "__main__":
    generate_build_info()
