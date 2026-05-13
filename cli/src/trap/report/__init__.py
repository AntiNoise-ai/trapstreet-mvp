from __future__ import annotations

import enum

from trap.report.base import BaseRenderer
from trap.report.json import JsonRenderer
from trap.report.rich import RichRenderer
from trap.report.saver import ReportSaver

__all__ = ["BaseRenderer", "JsonRenderer", "OutputFormat", "ReportSaver", "RichRenderer", "renderer_factory"]


class OutputFormat(enum.StrEnum):
    rich = "rich"
    json = "json"


def renderer_factory(fmt: OutputFormat) -> BaseRenderer:
    match fmt:
        case OutputFormat.rich:
            return RichRenderer()
        case OutputFormat.json:
            return JsonRenderer()
