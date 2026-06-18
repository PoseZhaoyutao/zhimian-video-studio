import sys
from pathlib import Path


SCRIPTS = (
    Path(__file__).parents[1]
    / "skills"
    / "zhimian-video-studio"
    / "scripts"
)
sys.path.insert(0, str(SCRIPTS))
