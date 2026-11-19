"""
Phase 1: Data Audit
Inspect both datasets: row counts, columns, dtypes, date ranges, missing values,
duplicates, base rates. Write reports/01_data_audit.md.
NOTE: Public consumer-travel proxy data, NOT TBO B2B data.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from .utils import load_config, get_project_root, setup_logging


def audit_expedia(cfg: dict, logger) -> dict:
    """Audit the Expedia Hotel Recommendations dataset (primary)."""
    root = get_project_root(cfg)
    raw_path = Path(cfg["paths"]["data"]["raw_expedia"])
    train_path = raw_path / cfg["data"]["expedia"]["train_csv"]
    dest_path = raw_path / cfg["data"]["expedia"]["destinations_csv"]
    chunk_size = cfg["data"]["expedia"]["chunk_size"]

    logger.info("Auditing Expedia dataset (chunked)...")
    
    stats = {
        "name": "Expedia Hotel Recommendations (Kaggle 2016)",
        "file": str(train_path),
        "note": "PUBLIC CONSUMER DATA - NOT TBO B2B",
    }

    # Read first chunk for schema
    first_chunk = pd.read_csv(train_path, nrows=5)
    stats["columns"] = list(first_chunk.columns)
    stats["dtypes"] = {c: str(first_chunk[c].dtype) for c in first_chunk.columns}

    # Accumulate stats across chunks
    total_rows = 0
    total_bookings = 0
    total_clicks = 0
    missing_counts = {c: 0 for c in first_chunk.columns}
    dates = []
    is_mobile_counts = {0: 0, 1: 0}
    is_package_counts = {0: 0, 1: 0}

    logger.info("Scanning all chunks...")
    for i, chunk in enumerate(pd.read_csv(train_path, chunksize=chunk_size,
                                           parse_dates=["date_time", "srch_ci", "srch_co"],
                                           low_memory=False)):
        total_rows += len(chunk)
        total_bookings += chunk["is_booking"].sum()
        total_clicks += (chunk["is_booking"] == 0).sum()
        for c in missing_counts:
            if c in chunk.columns:
                missing_counts[c] += chunk[c].isna().sum()
        # sample dates
        if i % 5 == 0:
            dt_sample = chunk["date_time"].dropna()
            if len(dt_sample) > 0:
                dates.append(dt_sample.iloc[0])
                dates.append(dt_sample.iloc[-1])
        is_mobile_counts[0] += (chunk["is_mobile"] == 0).sum()
        is_mobile_counts[1] += (chunk["is_mobile"] == 1).sum()
        is_package_counts[0] += (chunk["is_package"] == 0).sum()
        is_package_counts[1] += (chunk["is_package"] == 1).sum()
        if i % 10 == 0:
            logger.info(f"  chunk {i}: {total_rows:,} rows so far")

    stats["total_rows"] = total_rows
    stats["total_bookings"] = int(total_bookings)
    stats["total_clicks"] = int(total_clicks)
    stats["base_rate"] = round(total_bookings / total_rows, 4) if total_rows > 0 else 0
    stats["missing_counts"] = {c: int(v) for c, v in missing_counts.items()}
    stats["missing_pct"] = {c: round(v / total_rows * 100, 2) for c, v in missing_counts.items()}
    stats["date_range_approx"] = [str(min(dates)), str(max(dates))] if dates else ["unknown", "unknown"]
    stats["is_mobile_rate"] = round(is_mobile_counts[1] / total_rows, 4)
    stats["is_package_rate"] = round(is_package_counts[1] / total_rows, 4)

    logger.info(f"Expedia: {total_rows:,} rows, {total_bookings:,} bookings, base_rate={stats['base_rate']:.4f}")

    # Destinations.csv audit
    dest_df = pd.read_csv(dest_path, nrows=5)
    dest_rows = sum(1 for _ in open(dest_path, encoding="utf-8")) - 1
    stats["destinations"] = {
        "file": str(dest_path),
        "rows": dest_rows,
        "columns": list(dest_df.columns),
        "n_latent_features": len([c for c in dest_df.columns if c.startswith("d")]),
    }

    return stats


def audit_archive(cfg: dict, logger) -> dict:
    """Audit the archive/hotel_bookings.csv dataset (descriptive only)."""
    root = get_project_root(cfg)
    raw_path = Path(cfg["paths"]["data"]["raw_archive"])
    csv_path = raw_path / cfg["data"]["archive"]["hotel_bookings_csv"]

    logger.info("Auditing archive/hotel_bookings.csv dataset...")
    df = pd.read_csv(csv_path)

    stats = {
        "name": "Hotel Booking Demand (Antonio et al. 2019)",
        "file": str(csv_path),
        "note": "PUBLIC DATA - NOT TBO B2B. Descriptive appendix only. No is_booking label.",
        "total_rows": len(df),
        "columns": list(df.columns),
        "dtypes": {c: str(df[c].dtype) for c in df.columns},
        "missing_counts": {c: int(df[c].isna().sum()) for c in df.columns},
        "missing_pct": {c: round(df[c].isna().sum() / len(df) * 100, 2) for c in df.columns},
        "cancellation_rate": round(df["is_canceled"].mean(), 4),
        "hotel_types": df["hotel"].value_counts().to_dict(),
        "year_range": [int(df["arrival_date_year"].min()), int(df["arrival_date_year"].max())],
    }
    logger.info(f"Archive: {len(df):,} rows, cancellation_rate={stats['cancellation_rate']:.4f}")
    return stats


def make_charts(expedia_stats: dict, archive_stats: dict, report_dir: Path, logger):
    """Generate audit charts."""
    fig, axes = plt.subplots(2, 3, figsize=(16, 10))
    fig.suptitle("Data Audit: Expedia Hotel Recommendations\n(PUBLIC CONSUMER DATA — NOT TBO B2B)",
                 fontsize=13, fontweight="bold")

    # 1. Base rate
    ax = axes[0, 0]
    ax.bar(["Click (0)", "Booking (1)"],
           [expedia_stats["total_clicks"], expedia_stats["total_bookings"]],
           color=["steelblue", "orangered"])
    ax.set_title(f"Label Distribution\n(base_rate={expedia_stats['base_rate']:.3f})")
    ax.set_ylabel("Count")
    for rect in ax.patches:
        ax.annotate(f"{rect.get_height():,.0f}", (rect.get_x() + rect.get_width() / 2, rect.get_height()),
                    ha="center", va="bottom", fontsize=9)

    # 2. Missing values (top 10)
    ax = axes[0, 1]
    miss_pct = expedia_stats["missing_pct"]
    top_miss = dict(sorted(miss_pct.items(), key=lambda x: x[1], reverse=True)[:10])
    ax.barh(list(top_miss.keys()), list(top_miss.values()), color="salmon")
    ax.set_title("Missing Values % (top 10 cols)")
    ax.set_xlabel("% Missing")
    ax.axvline(5, color="red", linestyle="--", alpha=0.5, label="5%")
    ax.legend()

    # 3. Mobile vs non-mobile
    ax = axes[0, 2]
    ax.pie([expedia_stats["is_mobile_rate"], 1 - expedia_stats["is_mobile_rate"]],
           labels=["Mobile", "Desktop/Other"],
           autopct="%1.1f%%", colors=["#4CAF50", "#2196F3"])
    ax.set_title("Mobile vs Desktop Searches")

    # 4. Package vs non-package
    ax = axes[1, 0]
    ax.pie([expedia_stats["is_package_rate"], 1 - expedia_stats["is_package_rate"]],
           labels=["Package", "Non-package"],
           autopct="%1.1f%%", colors=["#FF9800", "#9C27B0"])
    ax.set_title("Package vs Non-package Searches")

    # 5. Archive: cancellation by hotel type
    ax = axes[1, 1]
    hotel_types = archive_stats["hotel_types"]
    ax.bar(list(hotel_types.keys()), list(hotel_types.values()), color=["teal", "coral"])
    ax.set_title("Archive: Hotel Types\n(Descriptive only - different dataset)")
    ax.set_ylabel("Count")

    # 6. Summary text
    ax = axes[1, 2]
    ax.axis("off")
    summary = (
        f"Dataset: Expedia Hotel Recommendations\n"
        f"Total rows: {expedia_stats['total_rows']:,}\n"
        f"Bookings: {expedia_stats['total_bookings']:,}\n"
        f"Clicks: {expedia_stats['total_clicks']:,}\n"
        f"Base rate: {expedia_stats['base_rate']:.4f}\n"
        f"Date range: {expedia_stats['date_range_approx'][0][:10]}\n"
        f"         to {expedia_stats['date_range_approx'][1][:10]}\n"
        f"Destinations: {expedia_stats['destinations']['rows']:,}\n"
        f"Latent features: {expedia_stats['destinations']['n_latent_features']}"
    )
    ax.text(0.05, 0.95, summary, transform=ax.transAxes, fontsize=10,
            verticalalignment="top", fontfamily="monospace",
            bbox=dict(boxstyle="round", facecolor="lightyellow", alpha=0.8))

    plt.tight_layout()
    chart_path = report_dir / "01_data_audit_charts.png"
    plt.savefig(chart_path, dpi=120, bbox_inches="tight")
    plt.close()
    logger.info(f"Charts saved to {chart_path}")
    return chart_path


def write_report(expedia_stats: dict, archive_stats: dict, chart_path: Path,
                 report_dir: Path, logger):
    report_path = report_dir / "01_data_audit.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Data Audit Report\n\n")
        f.write("> **IMPORTANT: Both datasets are PUBLIC CONSUMER-TRAVEL PROXY DATA, NOT TBO B2B data.**\n")
        f.write("> Results are for demonstration purposes only. Calibration will shift on real TBO traffic.\n\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n\n")

        f.write("## Dataset Identification\n\n")
        f.write("| Folder | Dataset | Usage |\n")
        f.write("|--------|---------|-------|\n")
        f.write(f"| `expedia-hotel-recommendations/` | Expedia Hotel Recommendations (Kaggle 2016) | **PRIMARY** — model training |\n")
        f.write(f"| `archive/hotel_bookings.csv` | Hotel Booking Demand (Antonio et al. 2019) | Descriptive appendix only |\n\n")

        f.write("## Primary Dataset: Expedia Hotel Recommendations\n\n")
        f.write(f"**File**: `{expedia_stats['file']}`\n\n")
        f.write(f"| Metric | Value |\n|--------|-------|\n")
        f.write(f"| Total rows | {expedia_stats['total_rows']:,} |\n")
        f.write(f"| Bookings (is_booking=1) | {expedia_stats['total_bookings']:,} |\n")
        f.write(f"| Clicks (is_booking=0) | {expedia_stats['total_clicks']:,} |\n")
        f.write(f"| **Base rate (booking%)** | **{expedia_stats['base_rate']:.4f} ({expedia_stats['base_rate']*100:.2f}%)** |\n")
        f.write(f"| Mobile searches | {expedia_stats['is_mobile_rate']*100:.1f}% |\n")
        f.write(f"| Package searches | {expedia_stats['is_package_rate']*100:.1f}% |\n")
        f.write(f"| Date range (approx) | {expedia_stats['date_range_approx'][0][:10]} to {expedia_stats['date_range_approx'][1][:10]} |\n\n")

        f.write("### Columns\n\n")
        f.write("| Column | Dtype | Missing% |\n|--------|-------|----------|\n")
        for col in expedia_stats["columns"]:
            f.write(f"| {col} | {expedia_stats['dtypes'].get(col,'?')} | {expedia_stats['missing_pct'].get(col,0):.2f}% |\n")

        f.write(f"\n### Destinations.csv\n\n")
        f.write(f"- Rows: {expedia_stats['destinations']['rows']:,}\n")
        f.write(f"- Columns: {len(expedia_stats['destinations']['columns'])}\n")
        f.write(f"- Latent features: {expedia_stats['destinations']['n_latent_features']} (d1..d{expedia_stats['destinations']['n_latent_features']})\n\n")

        f.write("## Secondary Dataset: Hotel Booking Demand (Descriptive Only)\n\n")
        f.write(f"**File**: `{archive_stats['file']}`\n\n")
        f.write(f"| Metric | Value |\n|--------|-------|\n")
        f.write(f"| Total rows | {archive_stats['total_rows']:,} |\n")
        f.write(f"| Cancellation rate | {archive_stats['cancellation_rate']:.4f} |\n")
        f.write(f"| Year range | {archive_stats['year_range'][0]}-{archive_stats['year_range'][1]} |\n\n")
        f.write("**Note**: This dataset has `is_canceled`, not `is_booking`. It is NOT pooled with Expedia. ")
        f.write("Used for supplementary descriptive patterns only.\n\n")

        f.write("## Charts\n\n")
        f.write(f"![Data Audit Charts](01_data_audit_charts.png)\n\n")

        f.write("## Key Findings\n\n")
        f.write(f"1. Expedia base rate is **{expedia_stats['base_rate']*100:.2f}%** (~{expedia_stats['base_rate']*1000:.0f} bookings per 1,000 searches).\n")
        f.write(f"2. `orig_destination_distance` has {expedia_stats['missing_pct'].get('orig_destination_distance',0):.1f}% missing — will add missing indicator.\n")
        f.write(f"3. `hotel_cluster` will be EXCLUDED (post-event information).\n")
        f.write(f"4. `cnt` will be EXCLUDED (post-event count of events in group).\n")
        f.write(f"5. Destinations.csv provides {expedia_stats['destinations']['n_latent_features']} latent features → PCA to {12} components.\n")

    logger.info(f"Data audit report written to {report_path}")
    return report_path


def run_phase1():
    cfg = load_config()
    root = get_project_root(cfg)
    logger = setup_logging(cfg, "phase1_data_audit")
    logger.info("Phase 1: Data Audit")

    report_dir = root / cfg["paths"]["reports"]
    report_dir.mkdir(parents=True, exist_ok=True)

    expedia_stats = audit_expedia(cfg, logger)
    archive_stats = audit_archive(cfg, logger)

    chart_path = make_charts(expedia_stats, archive_stats, report_dir, logger)
    report_path = write_report(expedia_stats, archive_stats, chart_path, report_dir, logger)

    # Save stats for downstream use
    interim_dir = root / cfg["paths"]["data"]["interim"]
    interim_dir.mkdir(parents=True, exist_ok=True)
    with open(interim_dir / "data_audit_stats.json", "w") as f:
        json.dump({"expedia": expedia_stats, "archive": archive_stats}, f, indent=2, default=str)

    logger.info("Phase 1 complete.")
    return expedia_stats, archive_stats


if __name__ == "__main__":
    run_phase1()
