import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).parents[1]
CLI = ROOT / "skills" / "zhimian-video-studio" / "scripts" / "run_daily.py"


def test_cli_help_lists_manual_and_rebuild_modes():
    result = subprocess.run(
        [sys.executable, str(CLI), "--help"],
        text=True,
        capture_output=True,
        encoding="utf-8",
    )
    assert result.returncode == 0
    assert "--date" in result.stdout
    assert "--rebuild" in result.stdout
    assert "--dry-run" in result.stdout
    assert "--make-plan" in result.stdout
    assert "--topic" in result.stdout
    assert "--plan-file" in result.stdout
