from __future__ import annotations

from collections.abc import Iterable, Iterator
from pathlib import Path
from typing import Any

from trap.models import CaseResult, Task, TrapTask, TrapTaskCase
from trap.runner.case import CaseRunner
from trap.runner.grader import GraderRunner
from trap.runner.judge import JudgeRunner


class TaskRunner:
    def __init__(
        self,
        task_obj: Task,
        trap_dir: Path,
        traptask_dir: Path,
        traptask_obj: TrapTask,
        task_outputs_dir: Path,
    ) -> None:
        self.task = task_obj
        self.trap_dir = trap_dir
        self.traptask_obj = traptask_obj
        self.traptask_dir = traptask_dir
        self.task_outputs_dir = task_outputs_dir

        self.task_inputs_dir = (traptask_dir / traptask_obj.dirs.inputs).resolve()
        self.task_expected_dir = (traptask_dir / traptask_obj.dirs.expected).resolve()

    def _update_latest(self) -> None:
        latest = self.task_outputs_dir.parent / "latest"
        if latest.is_symlink():
            latest.unlink()
        latest.symlink_to(self.task_outputs_dir.name)

    def _iter(self, cases: Iterable[TrapTaskCase], *, fail_fast: bool = False) -> Iterator[CaseResult]:
        # TODO: parallelize case runs, but judge cases sequentially in the same order as case runs
        for case in cases:
            result = CaseRunner(self, case.id).run()
            if self.traptask_obj.judge is not None:
                metrics = JudgeRunner(self, case.id).run()
                result = result.model_copy(update={"metrics": metrics})
            yield result
            if fail_fast and result.metrics is not None and result.metrics.get("score", 1.0) < 1.0:
                break

    def run(
        self, cases: Iterable[TrapTaskCase], *, fail_fast: bool = False
    ) -> tuple[tuple[CaseResult, ...], Any]:

        case_results = tuple(self._iter(cases, fail_fast=fail_fast))

        grader_metrics = None
        if self.traptask_obj.grader is not None:
            grader_metrics = GraderRunner(self, case_results).run()

        self._update_latest()
        return case_results, grader_metrics
