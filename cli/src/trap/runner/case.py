from __future__ import annotations

import json
import os
import shlex
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

from trap.models import CaseResult

if TYPE_CHECKING:
    from trap.runner.task import TaskRunner


@dataclass
class CaseOutputsPaths:
    stdout: Path
    stderr: Path
    meta: Path

    @classmethod
    def from_dir(cls, outputs_dir: Path) -> CaseOutputsPaths:
        return cls(
            stdout=outputs_dir / "case_stdout",
            stderr=outputs_dir / "case_stderr",
            meta=outputs_dir / "case_meta.json",
        )


class CaseRunner:
    def __init__(self, runner: TaskRunner, case_id: str) -> None:
        self.runner = runner
        self.case_id = case_id
        self.case_inputs_dir = runner.task_inputs_dir / case_id
        self.case_outputs_dir = runner.task_outputs_dir / case_id
        self.case_outputs_paths = CaseOutputsPaths.from_dir(self.case_outputs_dir)

    @property
    def _stdin(self) -> str:
        task_inputs = self.runner.task.inputs
        if task_inputs and task_inputs.stdin:
            return (self.case_inputs_dir / task_inputs.stdin).read_text()
        return ""

    @property
    def _inputs_envvar(self) -> str:
        return json.dumps(
            {f.name: str(f.resolve()) for f in sorted(self.case_inputs_dir.iterdir()) if f.is_file()}
        )

    @property
    def _outputs_envvar(self) -> str:
        return json.dumps(
            {name: str((self.case_outputs_dir / name).resolve()) for name in self.runner.task.file_outputs}
        )

    def run(self) -> CaseResult:
        self.case_outputs_dir.mkdir(parents=True, exist_ok=True)

        task = self.runner.task
        t0 = time.monotonic()
        proc = subprocess.run(
            shlex.split(task.cmd),
            input=self._stdin,
            capture_output=True,
            text=True,
            cwd=self.runner.trap_dir,
            timeout=task.timeout,
            env={
                **os.environ,
                task.inputs_envvar: self._inputs_envvar,
                task.outputs_envvar: self._outputs_envvar,
            },
        )
        duration = time.monotonic() - t0
        self.case_outputs_paths.stdout.write_text(proc.stdout)
        self.case_outputs_paths.stderr.write_text(proc.stderr)
        self.case_outputs_paths.meta.write_text(
            json.dumps({"exit_code": proc.returncode, "duration": duration})
        )
        return CaseResult(case_id=self.case_id, exit_code=proc.returncode, duration=duration, metrics=None)
