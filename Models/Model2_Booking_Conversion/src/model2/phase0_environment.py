"""
Phase 0: Environment audit — record hardware, Python and library versions.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import os
import platform
import subprocess
import sys
from pathlib import Path
from datetime import datetime

from .utils import load_config, get_project_root, setup_logging


def run_phase0():
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase0_environment")
    logger.info("Phase 0: Environment audit")

    report_dir = root / cfg["paths"]["reports"]
    report_dir.mkdir(parents=True, exist_ok=True)

    # Hardware
    cpu_count = os.cpu_count()
    
    # RAM via ctypes
    try:
        import ctypes
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ('dwLength', ctypes.c_ulong), ('dwMemoryLoad', ctypes.c_ulong),
                ('ullTotalPhys', ctypes.c_ulonglong), ('ullAvailPhys', ctypes.c_ulonglong),
                ('ullTotalPageFile', ctypes.c_ulonglong), ('ullAvailPageFile', ctypes.c_ulonglong),
                ('ullTotalVirtual', ctypes.c_ulonglong), ('ullAvailVirtual', ctypes.c_ulonglong),
                ('ullAvailExtendedVirtual', ctypes.c_ulonglong)
            ]
        stat = MEMORYSTATUSEX()
        stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
        ram_gb = round(stat.ullTotalPhys / 1e9, 1)
    except Exception:
        ram_gb = "unknown"

    # GPU
    gpu_info = "None"
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,driver_version",
             "--format=csv,noheader"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            gpu_info = result.stdout.strip()
    except Exception:
        pass

    # Library versions
    libs = {}
    lib_names = [
        "pandas", "numpy", "pyarrow", "sklearn", "xgboost", "shap",
        "matplotlib", "optuna", "joblib", "yaml", "scipy", "polars", "seaborn"
    ]
    for lib in lib_names:
        try:
            mod = __import__(lib if lib != "yaml" else "yaml")
            if lib == "sklearn":
                import sklearn
                libs[lib] = sklearn.__version__
            else:
                libs[lib] = getattr(mod, "__version__", "unknown")
        except ImportError:
            libs[lib] = "not installed"

    # Write report
    report_path = report_dir / "00_environment.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# Environment Report\n\n")
        f.write(f"> **Data is public consumer-travel proxy data, NOT TBO B2B data.**\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n\n")
        f.write(f"## Hardware\n\n")
        f.write(f"| Item | Value |\n|------|-------|\n")
        f.write(f"| OS | {platform.system()} {platform.release()} {platform.machine()} |\n")
        f.write(f"| Python | {sys.version} |\n")
        f.write(f"| CPU Cores (logical) | {cpu_count} |\n")
        f.write(f"| RAM | {ram_gb} GB |\n")
        f.write(f"| GPU | {gpu_info} |\n\n")
        f.write(f"## Library Versions\n\n")
        f.write(f"| Library | Version |\n|---------|--------|\n")
        for lib, ver in libs.items():
            f.write(f"| {lib} | {ver} |\n")
        f.write(f"\n## XGBoost Device\n\n")
        f.write(f"GPU detected: {'Yes' if gpu_info != 'None' else 'No'}  \n")
        f.write(f"Configured tree_method: `{cfg['model']['tree_method']}`  \n")
        f.write(f"Configured device: `{cfg['model']['device']}`  \n")

    logger.info(f"Environment report written to {report_path}")
    logger.info(f"Hardware: {cpu_count} CPUs, {ram_gb}GB RAM, GPU={gpu_info}")
    for lib, ver in libs.items():
        logger.info(f"  {lib}: {ver}")
    return {"cpu_count": cpu_count, "ram_gb": ram_gb, "gpu_info": gpu_info, "libs": libs}


if __name__ == "__main__":
    run_phase0()
