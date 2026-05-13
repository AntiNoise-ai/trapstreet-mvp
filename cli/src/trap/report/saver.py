from __future__ import annotations

from pathlib import Path
from typing import Any

from trap.models import CaseResult, ReportData, Task

_REPORT_FILENAME = "report.json"


class ReportSaver:
    @staticmethod
    def save(
        run_dir: Path,
        cases: tuple[CaseResult, ...],
        task: Task,
        grader_metrics: Any = None,
    ) -> ReportData:
        data = ReportData.from_run(cases, task, grader_metrics)
        (run_dir / _REPORT_FILENAME).write_text(data.model_dump_json(indent=2))
        return data

    @staticmethod
    def load(run_dir: Path) -> ReportData:
        report_path = run_dir / _REPORT_FILENAME
        if not report_path.exists():
            raise FileNotFoundError(f"no report found in {run_dir}")
        return ReportData.model_validate_json(report_path.read_text())
