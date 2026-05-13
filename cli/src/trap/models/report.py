from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from trap.models.config import Task
from trap.models.results import CaseResult


class Counts(BaseModel):
    passed: int
    failed: int
    skipped: int


class ReportData(BaseModel):
    task: Task
    cases: tuple[CaseResult, ...]
    run_counts: Counts
    grader_metrics: Any = None

    @classmethod
    def from_run(
        cls,
        cases: tuple[CaseResult, ...],
        task: Task,
        grader_metrics: Any = None,
    ) -> ReportData:
        return cls(
            task=task,
            cases=cases,
            grader_metrics=grader_metrics,
            run_counts=Counts(
                passed=sum(1 for r in cases if not r.skipped and r.exit_code == 0),
                failed=sum(1 for r in cases if not r.skipped and r.exit_code != 0),
                skipped=sum(1 for r in cases if r.skipped),
            ),
        )
