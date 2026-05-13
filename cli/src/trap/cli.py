from __future__ import annotations

import json as _json
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any

import typer
from rich.console import Console

from trap.loader import TrapLoader, TrapTaskLoader
from trap.report import OutputFormat, ReportSaver, renderer_factory
from trap.runner import TaskRunner

app = typer.Typer(help="AI prompt / agent / workflow / testing framework.")
console = Console()


@app.command()
def run(
    task: str | None = typer.Argument(None),
    trap_yaml_path: Path = typer.Option(Path("trap.yaml"), "--config", "-c"),
    tags: list[str] = typer.Option([], "--tag", "-t"),
    output: OutputFormat = typer.Option(OutputFormat.rich, "--output", "-o"),
    fail_fast: bool = typer.Option(False, "--fail-fast"),
    workspace: Path = typer.Option(Path(".trap"), "--workspace", "-w"),
) -> None:
    """Run a task against a solution."""
    trap_yaml_loader = TrapLoader(trap_yaml_path)
    task_obj = trap_yaml_loader.resolve_task(task)

    task_yaml_loader = TrapTaskLoader.from_task(task_obj, trap_yaml_loader.trap_dir)
    active_cases = task_yaml_loader.cases_with_tags(tags)

    ts = datetime.now().isoformat(timespec="seconds")
    trap_run_dir = workspace.resolve() / task_obj.name / ts

    runner = TaskRunner(
        task_obj=task_obj,
        trap_dir=trap_yaml_loader.trap_dir,
        traptask_obj=task_yaml_loader.traptask,
        traptask_dir=task_yaml_loader.task_dir,
        task_outputs_dir=trap_run_dir,
    )
    case_results, grader_metrics = runner.run(active_cases, fail_fast=fail_fast)

    report_data = ReportSaver.save(trap_run_dir, case_results, task_obj, grader_metrics=grader_metrics)
    renderer_factory(output).render(report_data)

    case_failed = any(cr.exit_code != 0 for cr in case_results)
    grader_failed = grader_metrics is not None and grader_metrics.get("passed") is False
    raise SystemExit(case_failed or grader_failed)


@app.command()
def report(
    task: str | None = typer.Argument(None),
    run: str = typer.Argument("latest"),
    trap_yaml_path: Path = typer.Option(Path("trap.yaml"), "--config", "-c"),
    output: OutputFormat = typer.Option(OutputFormat.rich, "--output", "-o"),
    workspace: Path = typer.Option(Path(".trap"), "--workspace", "-w"),
) -> None:
    """Display a report for a task (defaults to latest run)."""
    trap_yaml_loader = TrapLoader(trap_yaml_path)
    task_name = trap_yaml_loader.resolve_task(task).name
    run_dir = workspace.resolve() / task_name / run
    report_data = ReportSaver.load(run_dir)
    renderer_factory(output).render(report_data)


@app.command()
def submit(
    task: str | None = typer.Argument(
        None,
        help="Task name (defaults to first task in trap.yaml). "
        "Used as both the local run dir and the trapstreet task_id.",
    ),
    trap_yaml_path: Path = typer.Option(Path("trap.yaml"), "--config", "-c"),
    workspace: Path = typer.Option(Path(".trap"), "--workspace", "-w"),
    run: str = typer.Option(
        "latest", "--run", "-r", help="Which run to upload (default: latest)."
    ),
    server: str = typer.Option(
        "https://trapstreet.run",
        "--server",
        envvar="TRAPSTREET_URL",
        help="Trapstreet server URL.",
    ),
    api_key: str = typer.Option(
        ...,
        "--api-key",
        envvar="TRAPSTREET_API_KEY",
        help="Runner api_key (or set TRAPSTREET_API_KEY).",
    ),
) -> None:
    """Upload the latest report.json to trapstreet."""
    trap_yaml_loader = TrapLoader(trap_yaml_path)
    task_name = trap_yaml_loader.resolve_task(task).name

    report_path = workspace.resolve() / task_name / run / "report.json"
    if not report_path.exists():
        console.print(
            f"[red]error[/red]: no report at {report_path}. "
            "Run [bold]tp run[/bold] first."
        )
        raise SystemExit(2)

    payload = report_path.read_bytes()
    url = f"{server.rstrip('/')}/api/submit/{task_name}"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "authorization": f"Bearer {api_key}",
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body: Any = _json.loads(resp.read())
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", errors="replace")
        console.print(f"[red]http {e.code}[/red]: {msg}")
        raise SystemExit(2)
    except urllib.error.URLError as e:
        console.print(f"[red]connection error[/red]: {e.reason}")
        raise SystemExit(2)

    run_obj = body.get("run") or {}
    run_id = run_obj.get("id", "?")
    score = run_obj.get("total_score")
    passed = run_obj.get("passed")
    view_url = body.get("view_url", "")
    status = "[green]✓ passed[/green]" if passed else "[red]✗ failed[/red]"
    console.print(
        f"{status} [bold]{run_id}[/bold] · score [cyan]{score}[/cyan]"
    )
    if view_url:
        console.print(f"  → [link={view_url}]{view_url}[/link]")


@app.command()
def init() -> None:
    """Generate annotated trap.yaml + traptask.yaml scaffold."""
    console.print("not yet")
