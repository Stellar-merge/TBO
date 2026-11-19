"""
Utilities: config loading, logging, paths.
NOTE: This is public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

import yaml


def load_config(config_path: str | Path | None = None) -> dict:
    """Load config.yaml, resolving relative paths to project root."""
    if config_path is None:
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)
    return cfg


def get_project_root(cfg: dict | None = None) -> Path:
    if cfg is not None:
        return Path(cfg["paths"]["root"])
    return Path(__file__).parent.parent.parent


def resolve(cfg: dict, *keys: str) -> Path:
    """Resolve a path from config relative to project root."""
    root = get_project_root(cfg)
    val = cfg
    for k in keys:
        val = val[k]
    return root / val


def setup_logging(cfg: dict, name: str = "model2") -> logging.Logger:
    root = get_project_root(cfg)
    log_dir = root / cfg["paths"]["logs"]
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"{name}.log"

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if logger.handlers:
        logger.handlers.clear()

    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setLevel(logging.INFO)
    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(logging.INFO)

    fmt = logging.Formatter("%(asctime)s | %(name)s | %(levelname)s | %(message)s")
    fh.setFormatter(fmt)
    sh.setFormatter(fmt)

    logger.addHandler(fh)
    logger.addHandler(sh)
    return logger
