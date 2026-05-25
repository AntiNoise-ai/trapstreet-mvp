from __future__ import annotations

from datetime import datetime
from pathlib import Path

import typer
from rich.console import Console

from trap.auth import (
    DEFAULT_SERVER,
    AuthStore,
    OAuthCallbackServer,
    SubmitClient,
)
from trap.display import CaseProgress, render_submit_result
from trap.git_meta import detect_metadata
from trap.loader import TrapLoader, TrapTaskLoader
from trap.report import OutputFormat, ReportHandle, renderer_factory
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

    started_at = datetime.now()
    ts = started_at.isoformat(timespec="seconds")
    report_handle = ReportHandle(workspace.resolve(), task_obj.name, ts)

    runner = TaskRunner(
        task_obj=task_obj,
        trap_dir=trap_yaml_loader.trap_dir,
        traptask_obj=task_yaml_loader.traptask,
        traptask_dir=task_yaml_loader.task_dir,
        task_outputs_dir=report_handle.run_dir,
    )
    prog_console = console if output == OutputFormat.rich else None
    with CaseProgress(active_cases, console=prog_console) as prog:
        case_results, grader_metrics = runner.run(
            active_cases,
            fail_fast=fail_fast,
            on_case_start=prog.on_case_start,
            on_case_done=prog.on_case_done,
        )
    finished_at = datetime.now()

    # Sniff the solution dir for a git remote so the leaderboard row
    # gets a "↗ source" link automatically. trap.yaml metadata: block
    # overrides any auto-detected key.
    auto_metadata = detect_metadata(trap_yaml_loader.trap_dir)

    report_data = report_handle.save(
        cases=case_results,
        task=task_obj,
        started_at=started_at,
        finished_at=finished_at,
        grader_metrics=grader_metrics,
        auto_metadata=auto_metadata,
    )
    renderer_factory(output).render(report_data)

    case_failed = any(cr.exit_code != 0 for cr in case_results)
    raise typer.Exit(code=case_failed)


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
    report_data = ReportHandle(workspace.resolve(), task_name, run).load()
    renderer_factory(output).render(report_data)


@app.command()
def login(
    server: str | None = typer.Option(
        None,
        "--server",
        envvar="TRAPSTREET_URL",
        help="Trapstreet server URL.",
    ),
    timeout: int = typer.Option(300, "--timeout", help="Seconds to wait for browser approval."),
) -> None:
    """Open the browser to authorize this machine; save api_key locally.

    Starts a temporary HTTP server on localhost, opens
    <server>/cli/authorize?return=http://localhost:<port>/callback in your
    browser, and waits for the redirect back with the api_key.

    The token is saved to ~/.config/trapstreet/auth.json (mode 600).
    Subsequent `tp submit` calls read from there automatically — no env
    var needed (but TRAPSTREET_API_KEY still works as an override).
    """
    auth_store = AuthStore()
    stored = auth_store.load()
    # priority: --server / TRAPSTREET_URL env > auth.json > default
    resolved_server_url = server or (stored.server if stored else None) or DEFAULT_SERVER
    callback_server = OAuthCallbackServer(resolved_server_url)
    console.print(f"opening [link={callback_server.auth_url}]{callback_server.auth_url}[/link]")
    if not callback_server.run(timeout):
        console.print(f"[red]timed out after {timeout}s[/red] waiting for browser approval")
        raise typer.Exit(code=2)
    auth_data = callback_server.auth_data
    assert auth_data is not None
    path = auth_store.save(auth_data)
    sol_hint = f" · solution [bold]{auth_data.solution}[/bold]" if auth_data.solution else ""
    console.print(f"[green]✓ logged in[/green]{sol_hint} · token saved to {path}")


@app.command()
def logout() -> None:
    """Delete the locally-stored api_key."""
    auth_store = AuthStore()
    if not auth_store.exists:
        console.print(f"already logged out — no file at {auth_store.PATH}")
        return
    auth_store.delete()
    console.print(f"[green]✓[/green] removed {auth_store.PATH}")


@app.command()
def submit(
    task: str | None = typer.Argument(
        None,
        help="Task name (defaults to first task in trap.yaml). "
        "Used as both the local run dir and the trapstreet task_id.",
    ),
    trap_yaml_path: Path = typer.Option(Path("trap.yaml"), "--config", "-c"),
    workspace: Path = typer.Option(Path(".trap"), "--workspace", "-w"),
    run: str = typer.Option("latest", "--run", "-r", help="Which run to upload (default: latest)."),
    server: str | None = typer.Option(
        None,
        "--server",
        envvar="TRAPSTREET_URL",
        help="Trapstreet server URL.",
    ),
    api_key: str | None = typer.Option(
        None,
        "--api-key",
        envvar="TRAPSTREET_API_KEY",
        help="Solution api_key. Falls back to TRAPSTREET_API_KEY env, "
        "then ~/.config/trapstreet/auth.json (see `tp login`).",
    ),
) -> None:
    """Upload the latest report.json to trapstreet."""
    auth_store = AuthStore()
    stored = auth_store.load()
    # priority: --server / TRAPSTREET_URL env > auth.json > default
    resolved_server_url = server or (stored.server if stored else None) or DEFAULT_SERVER
    # priority: --api-key / TRAPSTREET_API_KEY env > auth.json
    resolved_key = api_key or (stored.api_key if stored else None)
    if not resolved_key:
        console.print(
            "[red]not logged in[/red]. Run [bold]tp login[/bold] "
            "or set [bold]TRAPSTREET_API_KEY[/bold] / pass [bold]--api-key[/bold]."
        )
        raise typer.Exit(code=2)

    task_name = TrapLoader(trap_yaml_path).resolve_task(task).name

    report_handle = ReportHandle(workspace.resolve(), task_name, run)
    try:
        report_handle.assert_exists()
    except FileNotFoundError:
        console.print(
            f"[red]error[/red]: no report at {report_handle.report_json_path}. Run [bold]tp run[/bold] first."
        )
        raise typer.Exit(code=2) from None

    client = SubmitClient(resolved_server_url, resolved_key)
    resp_data = client.submit(task_name, report_handle.report_json_path)
    render_submit_result(resp_data)


@app.command()
def init() -> None:
    """Generate annotated trap.yaml + traptask.yaml scaffold."""
    console.print("not yet")
