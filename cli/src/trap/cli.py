from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console

from trap.auth import DEFAULT_SERVER, ApiClient, AuthStore, BrowserProvider, TokenProvider
from trap.display import CaseProgress, render_submit_result
from trap.git_meta import detect_metadata
from trap.loader import TrapLoader, TrapTaskLoader
from trap.report import OutputFormat, ReportHandle, renderer_factory
from trap.runner import TaskRunner

app = typer.Typer(help="AI prompt / agent / workflow / testing framework.")
auth_app = typer.Typer(help="Manage authentication.")
app.add_typer(auth_app, name="auth")
console = Console()


@app.command()
def run(
    task: Annotated[str | None, typer.Argument()] = None,
    trap_yaml_path: Annotated[Path, typer.Option("--config", "-c")] = Path("trap.yaml"),
    tags: Annotated[list[str] | None, typer.Option("--tag", "-t")] = None,
    output: Annotated[OutputFormat, typer.Option("--output", "-o")] = OutputFormat.rich,
    fail_fast: Annotated[bool, typer.Option("--fail-fast")] = False,
    workspace: Annotated[Path, typer.Option("--workspace", "-w")] = Path(".trap"),
) -> None:
    """Run a task against a solution."""
    trap_yaml_loader = TrapLoader(trap_yaml_path)
    task_obj = trap_yaml_loader.resolve_task(task)

    task_yaml_loader = TrapTaskLoader.from_task(task_obj, trap_yaml_loader.trap_dir)
    active_cases = task_yaml_loader.cases_with_tags(tags or [])

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
    task: Annotated[str | None, typer.Argument()] = None,
    run: Annotated[str, typer.Argument()] = "latest",
    trap_yaml_path: Annotated[Path, typer.Option("--config", "-c")] = Path("trap.yaml"),
    output: Annotated[OutputFormat, typer.Option("--output", "-o")] = OutputFormat.rich,
    workspace: Annotated[Path, typer.Option("--workspace", "-w")] = Path(".trap"),
) -> None:
    """Display a report for a task (defaults to latest run)."""
    trap_yaml_loader = TrapLoader(trap_yaml_path)
    task_name = trap_yaml_loader.resolve_task(task).name
    report_data = ReportHandle(workspace.resolve(), task_name, run).load()
    renderer_factory(output).render(report_data)


@auth_app.command("login")
def auth_login(
    server: Annotated[
        str | None,
        typer.Option("--server", envvar="TRAPSTREET_URL", help="Trapstreet server URL."),
    ] = None,
    timeout: Annotated[int, typer.Option("--timeout", help="Seconds to wait for browser approval.")] = 300,
    with_token: Annotated[
        bool,
        typer.Option("--with-token", help="Read api_key from stdin instead of opening a browser."),
    ] = False,
) -> None:
    """Authenticate this machine with Trapstreet.

    By default opens a browser to complete OAuth. Pass --with-token to supply
    an api_key directly (useful for CI or headless environments).

    The token is saved to ~/.config/trapstreet/auth.json (mode 600).
    """
    stored = AuthStore().load()
    # priority: --server / TRAPSTREET_URL > stored > default
    resolved_server = server or (stored.server if stored else None) or DEFAULT_SERVER

    if with_token:
        if sys.stdin.isatty():
            token = typer.prompt("API key", hide_input=True)
        else:
            token = sys.stdin.read().strip()
        provider = TokenProvider(resolved_server, token)
    else:
        if server and server != DEFAULT_SERVER:
            console.print(
                f"[red]error[/red]: browser login is only supported on {DEFAULT_SERVER}. "
                "Use --with-token for custom servers."
            )
            raise typer.Exit(code=2)
        provider = BrowserProvider(resolved_server, timeout)

    console.print(provider.pre_message)
    try:
        auth_data = provider.acquire()
    except (ValueError, TimeoutError) as e:
        console.print(f"[red]error[/red]: {e}")
        raise typer.Exit(code=2) from None

    path = AuthStore().save(auth_data)
    console.print(
        "[green]✓ logged in[/green]"
        + (f" · solution [bold]{auth_data.solution}[/bold]" if auth_data.solution else "")
        + f" · token saved to {path}"
    )


@auth_app.command("logout")
def auth_logout() -> None:
    """Delete the locally-stored api_key."""
    auth_store = AuthStore()
    if not auth_store.exists:
        console.print(f"already logged out — no file at {auth_store.PATH}")
        return
    auth_store.delete()
    console.print(f"[green]✓[/green] removed {auth_store.PATH}")


@auth_app.command("status")
def auth_status(
    verify: Annotated[
        bool,
        typer.Option("--verify/--no-verify", help="Ping server to verify token validity."),
    ] = True,
) -> None:
    """Show current authentication state."""
    stored = AuthStore().load()
    if not stored:
        console.print("[red]not logged in[/red]. Run [bold]tp auth login[/bold].")
        raise typer.Exit(code=1)

    console.print(f"  server    {stored.server}")
    if stored.solution:
        console.print(f"  solution  [bold]{stored.solution}[/bold]")

    if not verify:
        return

    client = ApiClient(stored.server, stored.api_key)
    me = client.get_me()
    user = me.get("user") or {}
    identity = user.get("name") or user.get("email") or "(unknown)"
    console.print(f"  user      {identity}\n[green]✓ token is valid[/green]")


@app.command()
def submit(
    task: Annotated[
        str | None,
        typer.Argument(
            help="Task name (defaults to first task in trap.yaml). "
            "Used as both the local run dir and the trapstreet task_id.",
        ),
    ] = None,
    trap_yaml_path: Annotated[Path, typer.Option("--config", "-c")] = Path("trap.yaml"),
    workspace: Annotated[Path, typer.Option("--workspace", "-w")] = Path(".trap"),
    run: Annotated[str, typer.Option("--run", "-r", help="Which run to upload.")] = "latest",
) -> None:
    """Upload the latest report.json to trapstreet."""
    stored = AuthStore().load()
    # priority: TRAPSTREET_URL env > stored > default
    resolved_server = (
        os.environ.get("TRAPSTREET_URL") or (stored.server if stored else None) or DEFAULT_SERVER
    )
    # priority: TRAPSTREET_API_KEY env > stored
    resolved_key = os.environ.get("TRAPSTREET_API_KEY") or (stored.api_key if stored else None)
    if not resolved_key:
        console.print(
            "[red]not logged in[/red]. Run [bold]tp auth login[/bold] or set [bold]TRAPSTREET_API_KEY[/bold]."
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

    client = ApiClient(resolved_server, resolved_key)
    resp_data = client.submit(task_name, report_handle.report_json_path)
    render_submit_result(resp_data)


@app.command()
def init() -> None:
    """Generate annotated trap.yaml + traptask.yaml scaffold."""
    console.print("not yet")
