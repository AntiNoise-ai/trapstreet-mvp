# Loads trap.yaml and traptask.yaml into their respective loader classes.
from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path

import yaml
from pydantic import TypeAdapter

from trap.models import Task, TrapTask, TrapTaskCase

_tasks_adapter: TypeAdapter[dict[str, Task]] = TypeAdapter(dict[str, Task])


class TrapLoader:
    """Loads trap.yaml (solution author's config)."""

    def __init__(self, trap_yaml_path: Path) -> None:
        self.trap_dir: Path = trap_yaml_path.resolve().parent
        data = yaml.safe_load(trap_yaml_path.read_text())
        raw = _tasks_adapter.validate_python(data["tasks"])
        self.tasks: dict[str, Task] = {
            name: task.model_copy(update={"name": name}) for name, task in raw.items()
        }

    def select_task(self, name: str) -> Task:
        """Return task by name."""
        if name not in self.tasks:
            raise KeyError(f"task {name!r} not found in trap.yaml")
        return self.tasks[name]

    def resolve_task(self, name: str | None) -> Task:
        """Return named task, or the first task if name is None."""
        return self.select_task(name or next(iter(self.tasks)))


class TrapTaskLoader:
    """Loads traptask.yaml (task author's config) and resolves runtime paths."""

    def __init__(self, traptask_yaml_path: Path) -> None:
        self.task_dir: Path = traptask_yaml_path.resolve().parent
        if traptask_yaml_path.exists():
            self.traptask = TrapTask.model_validate(yaml.safe_load(traptask_yaml_path.read_text()))
        else:
            self.traptask = self._discover(self.task_dir)
        self.inputs_dir: Path = (self.task_dir / self.traptask.dirs.inputs).resolve()
        self.expected_dir: Path = (self.task_dir / self.traptask.dirs.expected).resolve()

    @staticmethod
    def _discover(task_dir: Path) -> TrapTask:
        """Auto-build TrapTask by scanning inputs/ when traptask.yaml is absent."""
        inputs_dir = task_dir / "inputs"
        if not inputs_dir.is_dir():
            raise FileNotFoundError(f"no traptask.yaml and no inputs/ directory found in {task_dir}")
        case_ids = sorted(p.name for p in inputs_dir.iterdir() if p.is_dir())
        if not case_ids:
            raise FileNotFoundError(f"inputs/ in {task_dir} has no case subdirectories")
        return TrapTask(cases=tuple(TrapTaskCase(id=case_id) for case_id in case_ids))

    @classmethod
    def from_task(cls, task: Task, trap_dir: Path) -> TrapTaskLoader:
        """Resolve traptask.yaml from a Task's directory path and the trap.yaml directory."""
        traptask_dir = (trap_dir / task.traptask).resolve()
        return cls(traptask_dir / "traptask.yaml")

    @property
    def cases(self) -> tuple[TrapTaskCase, ...]:
        """Return all non-skipped cases."""
        return tuple(c for c in self.traptask.cases if not c.skip)

    def cases_with_tags(self, tags: Iterable[str] | None = None) -> tuple[TrapTaskCase, ...]:
        """Return non-skipped cases matching any of the specified tags, or all cases if tags is empty/None."""
        if not (tag_set := set(tags or ())):
            return self.cases
        return tuple(c for c in self.cases if not tag_set.isdisjoint(c.tags))
