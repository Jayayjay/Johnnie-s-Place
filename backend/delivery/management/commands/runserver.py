"""`runserver` that also builds + watches the React frontend.

`python manage.py runserver` then serves the API **and** the built SPA from one port,
rebuilding `frontend/dist` whenever a frontend file changes (refresh to see it). This
app sits after `django.contrib.staticfiles` in INSTALLED_APPS, so it overrides the
built-in runserver while keeping its static-serving behaviour (we subclass it).
"""
import os
import subprocess
from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles.management.commands.runserver import (
    Command as StaticfilesRunserverCommand,
)


class Command(StaticfilesRunserverCommand):
    help = "Run the dev server, and (in DEBUG) build + watch the React frontend."

    _watcher = None

    def handle(self, *args, **options):
        # Spawn the watcher once — in the outer reloader process (or the single
        # --noreload process), not in the autoreloader's restarting child.
        if settings.DEBUG and os.environ.get("RUN_MAIN") != "true":
            self._start_frontend_watch()
        try:
            super().handle(*args, **options)
        finally:
            self._stop_frontend_watch()

    def _start_frontend_watch(self):
        frontend = Path(settings.BASE_DIR).parent / "frontend"
        if not (frontend / "package.json").exists():
            return
        try:
            self.stdout.write(self.style.NOTICE(
                "Frontend: building + watching (npm run build -- --watch)…"
            ))
            self._watcher = subprocess.Popen(
                ["npm", "run", "build", "--", "--watch"],
                cwd=str(frontend),
            )
        except FileNotFoundError:
            self.stdout.write(self.style.WARNING(
                "npm not found — serving the existing frontend/dist build only."
            ))

    def _stop_frontend_watch(self):
        if self._watcher and self._watcher.poll() is None:
            self._watcher.terminate()
            try:
                self._watcher.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._watcher.kill()
