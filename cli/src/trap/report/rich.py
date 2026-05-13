from __future__ import annotations

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from trap.models import CaseResult, ReportData
from trap.report.base import BaseRenderer


class RichRenderer(BaseRenderer):
    def __init__(self, console: Console | None = None) -> None:
        self.console = console or Console()

    @staticmethod
    def _get_metrics_keys(data: ReportData) -> set[str]:
        return {key for result in data.cases if result.metrics for key in result.metrics}

    @staticmethod
    def _render_metric_cell(value: object) -> str:
        if value is None:
            return "[dim]—[/dim]"
        if isinstance(value, bool):
            return "[bold green]✓[/bold green]" if value else "[bold red]✗[/bold red]"
        if isinstance(value, float) and 0.0 <= value <= 1.0:
            pct = value * 100
            if pct >= 100:
                return f"[bold green]{pct:.0f}%[/bold green]"
            if pct > 0:
                return f"[bold yellow]{pct:.0f}%[/bold yellow]"
            return f"[bold red]{pct:.0f}%[/bold red]"
        return str(value)

    @staticmethod
    def _render_status(result: CaseResult) -> tuple[str, str]:
        match result:
            case CaseResult(skipped=True):
                return "SKIP", "dim"
            case CaseResult(exit_code=0):
                return "PASS", "bold green"
            case _:
                return "FAIL", "bold red"

    def _build_table(self, data: ReportData) -> Table:
        metrics_keys = self._get_metrics_keys(data)
        table = Table(box=box.ROUNDED, show_header=True, header_style="bold", expand=True)
        table.add_column("case")
        table.add_column("status", justify="center")
        table.add_column("time", justify="right", style="dim")
        for key in metrics_keys:
            table.add_column(f"# {key}", justify="right", header_style="bold cyan")
        for result in data.cases:
            label, style = self._render_status(result)
            row = [result.case_id, f"[{style}]{label}[/{style}]", f"{result.duration:.3f}s"]
            for key in metrics_keys:
                value = result.metrics.get(key) if result.metrics else None
                row.append(self._render_metric_cell(value))
            table.add_row(*row)
        return table

    def _build_summary(self, data: ReportData) -> Panel:
        stats = []
        if data.run_counts.passed:
            stats.append(f"[bold green]{data.run_counts.passed} passed[/bold green]")
        if data.run_counts.failed:
            stats.append(f"[bold red]{data.run_counts.failed} failed[/bold red]")
        if data.run_counts.skipped:
            stats.append(f"[dim]{data.run_counts.skipped} skipped[/dim]")

        rows: list[tuple[str, Text | str]] = [
            ("task", Text(data.task.name, style="bold")),
            ("cmd", Text(data.task.cmd, style="dim")),
            ("result", Text.from_markup(" · ".join(stats))),
        ]
        if data.task.description:
            rows.insert(1, ("desc", Text(data.task.description, style="dim")))
        if data.grader_metrics is not None:
            parts = [self._render_metric_cell(v) + f" {k}" for k, v in data.grader_metrics.items()]
            rows.append(("grader", Text.from_markup("  ".join(parts))))

        grid = Table.grid(padding=(0, 2))
        grid.add_column(style="dim", justify="right")
        grid.add_column()
        for key, value in rows:
            grid.add_row(key, value)

        return Panel(grid, title="Summary", expand=True)

    def render(self, data: ReportData) -> None:
        self.console.print(self._build_summary(data))
        self.console.print(self._build_table(data))
