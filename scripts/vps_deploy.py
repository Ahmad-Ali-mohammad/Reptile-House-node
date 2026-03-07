#!/usr/bin/env python3
from __future__ import annotations

import argparse
import io
import json
import os
import posixpath
import shlex
import subprocess
import sys
import tarfile
import time
from pathlib import Path

try:
    import paramiko
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Missing dependency: paramiko. Install it with `python -m pip install paramiko`."
    ) from exc


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = ROOT / ".vps-deploy.json"
EXAMPLE_CONFIG_PATH = ROOT / "deploy" / "vps-deploy.example.json"
DEFAULT_ENDPOINT_CHECKS = [
    "/api/settings/store",
    "/api/backup-settings",
    "/api/api-keys",
]


def emit(text: str = "", *, stream=sys.stdout) -> None:
    safe = text.encode("ascii", "ignore").decode("ascii", "ignore")
    print(safe, file=stream)


def die(message: str, code: int = 1) -> "NoReturn":
    emit(f"ERROR: {message}", stream=sys.stderr)
    raise SystemExit(code)


def run_local(command: list[str], *, capture: bool = False) -> str:
    result = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        check=False,
        capture_output=capture,
    )
    if result.returncode != 0:
        if capture:
            emit(result.stdout)
            emit(result.stderr, stream=sys.stderr)
        die(f"Local command failed ({result.returncode}): {' '.join(command)}")
    return (result.stdout if capture else "").strip()


def read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        die(f"Invalid JSON in {path}: {exc}")


def lookup(config: dict, *keys: str, env: str | None = None, default=None):
    for key in keys:
        if key in config and config[key] not in (None, ""):
            return config[key]
    if env and os.getenv(env) not in (None, ""):
        return os.getenv(env)
    return default


def split_csv(value: str | list[str] | None) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [part.strip() for part in str(value).split(",") if part.strip()]


def build_compose_base(cfg: dict) -> str:
    base_dir = shlex.quote(cfg["base_dir"])
    env_file = shlex.quote(cfg["compose_env_file"])
    compose_files = " ".join(
        f"-f {shlex.quote(path)}" for path in cfg["compose_files"]
    )
    return f"cd {base_dir} && docker compose --env-file {env_file} {compose_files}"


def list_tracked_files() -> list[str]:
    output = run_local(["git", "ls-files", "-z"], capture=True)
    if not output:
        return []
    return [part for part in output.split("\0") if part]


def create_repo_archive(files: list[str]) -> io.BytesIO:
    archive = io.BytesIO()
    with tarfile.open(fileobj=archive, mode="w:gz") as tar:
        for rel_path in files:
            abs_path = ROOT / rel_path
            if abs_path.is_file():
                tar.add(str(abs_path), arcname=rel_path)
    archive.seek(0)
    return archive


def create_directory_archive(directory: Path) -> io.BytesIO:
    archive = io.BytesIO()
    with tarfile.open(fileobj=archive, mode="w:gz") as tar:
        for path in directory.rglob("*"):
            if path.is_file():
                tar.add(str(path), arcname=str(path.relative_to(directory)).replace("\\", "/"))
    archive.seek(0)
    return archive


class RemoteSession:
    def __init__(self, cfg: dict):
        self.cfg = cfg
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    def __enter__(self) -> "RemoteSession":
        connect_kwargs = {
            "hostname": self.cfg["host"],
            "username": self.cfg["user"],
            "port": int(self.cfg["port"]),
            "timeout": 20,
        }
        if self.cfg.get("ssh_key_path"):
            connect_kwargs["key_filename"] = self.cfg["ssh_key_path"]
        else:
            connect_kwargs["password"] = self.cfg["password"]
        self.client.connect(**connect_kwargs)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.client.close()

    def run(self, command: str, *, timeout: int = 120, check: bool = True) -> tuple[int, str, str]:
        emit(f">>> {command}")
        stdin, stdout, stderr = self.client.exec_command(command, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        emit(out)
        emit(err, stream=sys.stderr)
        if check and code != 0:
            raise RuntimeError(f"Remote command failed ({code}): {command}")
        return code, out, err

    def extract_archive(self, archive: io.BytesIO) -> None:
        command = f"mkdir -p {shlex.quote(self.cfg['base_dir'])} && tar -xzf - -C {shlex.quote(self.cfg['base_dir'])}"
        emit(f">>> {command}")
        stdin, stdout, stderr = self.client.exec_command(command, timeout=1200)
        stdin.channel.sendall(archive.getvalue())
        stdin.channel.shutdown_write()
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        emit(out)
        emit(err, stream=sys.stderr)
        if code != 0:
            raise RuntimeError(f"Remote archive extraction failed ({code})")


def wait_for_health(remote: RemoteSession, container_name: str, *, seconds: int = 240) -> None:
    last_status = ""
    for _ in range(seconds // 3):
        _, out, _ = remote.run(
            f"docker inspect -f '{{{{.State.Health.Status}}}}' {shlex.quote(container_name)}",
            timeout=30,
            check=False,
        )
        last_status = out.strip()
        emit(f"{container_name}_HEALTH={last_status}")
        if last_status == "healthy":
            return
        time.sleep(3)
    raise RuntimeError(
        f"Container {container_name} did not become healthy. Last status: {last_status or 'unknown'}"
    )


def maybe_push(branch: str, push_remotes: list[str], *, dry_run: bool) -> None:
    if not push_remotes:
        return
    for remote in push_remotes:
        command = ["git", "push", remote, branch]
        emit(f"Local push: {' '.join(command)}")
        if not dry_run:
            run_local(command)


def verify_worktree(*, allow_dirty: bool, skip_push: bool) -> None:
    status = run_local(["git", "status", "--porcelain"], capture=True)
    if not status:
        return
    if not allow_dirty:
        die(
            "Working tree is dirty. Commit or stash changes first, or rerun with --allow-dirty."
        )
    if not skip_push:
        die(
            "Cannot push while deploying a dirty working tree. Use --skip-push or commit first."
        )
    emit("WARNING: deploying dirty working tree because --allow-dirty was provided.")


def resolve_config(args: argparse.Namespace) -> tuple[dict, Path]:
    config_path = Path(args.config).resolve() if args.config else DEFAULT_CONFIG_PATH
    raw = read_json(config_path)
    cfg = {
        "host": lookup(raw, "host", env="VPS_HOST"),
        "user": lookup(raw, "user", env="VPS_USER"),
        "password": lookup(raw, "password", env="VPS_PASSWORD"),
        "ssh_key_path": lookup(raw, "sshKeyPath", "ssh_key_path", env="VPS_SSH_KEY_PATH"),
        "port": int(lookup(raw, "port", env="VPS_PORT", default=22)),
        "base_dir": lookup(raw, "baseDir", "base_dir", env="VPS_BASE_DIR", default="/opt/reptile-house-docker"),
        "compose_env_file": lookup(
            raw,
            "composeEnvFile",
            "compose_env_file",
            env="VPS_COMPOSE_ENV_FILE",
            default=".env",
        ),
        "compose_files": split_csv(
            lookup(
                raw,
                "composeFiles",
                "compose_files",
                env="VPS_COMPOSE_FILES",
                default=["docker-compose.yml", "docker-compose.vps.yml"],
            )
        )
        or ["docker-compose.yml", "docker-compose.vps.yml"],
        "legacy_service_name": lookup(
            raw,
            "legacyServiceName",
            "legacy_service_name",
            env="VPS_LEGACY_SERVICE_NAME",
            default="reptile-api.service",
        ),
        "app_container_name": lookup(
            raw,
            "appContainerName",
            "app_container_name",
            env="VPS_APP_CONTAINER_NAME",
            default="reptilehouse-app-1",
        ),
        "db_container_name": lookup(
            raw,
            "dbContainerName",
            "db_container_name",
            env="VPS_DB_CONTAINER_NAME",
            default="reptilehouse-db-1",
        ),
        "static_frontend_dir": lookup(
            raw,
            "staticFrontendDir",
            "static_frontend_dir",
            env="VPS_STATIC_FRONTEND_DIR",
        ),
        "static_frontend_owner": lookup(
            raw,
            "staticFrontendOwner",
            "static_frontend_owner",
            env="VPS_STATIC_FRONTEND_OWNER",
        ),
        "push_remotes": split_csv(
            args.push_remote
            if args.push_remote
            else lookup(raw, "pushRemotes", "push_remotes", env="VPS_PUSH_REMOTES")
        ),
        "admin_email": lookup(raw, "adminEmail", "admin_email", env="VPS_ADMIN_EMAIL"),
        "admin_password": lookup(raw, "adminPassword", "admin_password", env="VPS_ADMIN_PASSWORD"),
        "endpoint_checks": split_csv(
            lookup(raw, "endpointChecks", "endpoint_checks", env="VPS_ENDPOINT_CHECKS", default=DEFAULT_ENDPOINT_CHECKS)
        )
        or DEFAULT_ENDPOINT_CHECKS,
    }

    if not cfg["host"] or not cfg["user"]:
        die(
            "Missing VPS host/user. Create .vps-deploy.json from "
            f"{EXAMPLE_CONFIG_PATH.name} or export VPS_HOST/VPS_USER."
        )
    if not cfg["password"] and not cfg["ssh_key_path"]:
        die("Missing VPS password or sshKeyPath.")
    return cfg, config_path


def backup_database(remote: RemoteSession, cfg: dict, commit_short: str, *, dry_run: bool) -> str:
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    remote_path = posixpath.join(
        cfg["base_dir"], "deploy", "backups", f"predeploy-{timestamp}-{commit_short}.sql"
    )
    command = (
        f"mkdir -p {shlex.quote(posixpath.dirname(remote_path))} && "
        f"docker exec {shlex.quote(cfg['db_container_name'])} sh -lc "
        + shlex.quote(
            'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" '
            "--single-transaction --quick --routines --triggers semo_reptile_house"
        )
        + f" > {shlex.quote(remote_path)} && echo {shlex.quote(remote_path)}"
    )
    emit(f"Remote DB backup -> {remote_path}")
    if dry_run:
        emit(command)
        return remote_path
    remote.run(command, timeout=600)
    return remote_path


def verify_application(remote: RemoteSession, cfg: dict, *, dry_run: bool) -> None:
    health_command = "curl -sf http://127.0.0.1:3001/health"
    emit(f"Verify health: {health_command}")
    if dry_run:
        return
    remote.run(health_command, timeout=30)

    if not cfg["admin_email"] or not cfg["admin_password"]:
        emit("Skipping admin endpoint verification because admin credentials are not configured.")
        return

    login_payload = json.dumps(
        {"email": cfg["admin_email"], "password": cfg["admin_password"]},
        separators=(",", ":"),
    )
    endpoint_checks = " ".join(shlex.quote(path) for path in cfg["endpoint_checks"])
    command = (
        "TOKEN=$(curl -sf -H 'Content-Type: application/json' "
        f"-d {shlex.quote(login_payload)} "
        "http://127.0.0.1:3001/api/auth/login | "
        "python3 -c 'import sys,json; print(json.load(sys.stdin)[\"token\"])'); "
        f"for path in {endpoint_checks}; do "
        'curl -sf -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:3001$path" >/dev/null && '
        'echo "$path ok"; '
        "done"
    )
    remote.run(command, timeout=60)


def sync_static_frontend(
    remote: RemoteSession,
    cfg: dict,
    commit_short: str,
    frontend_archive: io.BytesIO,
) -> str:
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    static_dir = cfg["static_frontend_dir"]
    backup_path = posixpath.join(
        cfg["base_dir"], "deploy", "backups", f"frontend-{timestamp}-{commit_short}.tar.gz"
    )
    remote.run(
        f"mkdir -p {shlex.quote(posixpath.dirname(backup_path))} && "
        f"tar -czf {shlex.quote(backup_path)} -C {shlex.quote(static_dir)} .",
        timeout=300,
    )
    remote.run(
        f"find {shlex.quote(static_dir)} -mindepth 1 -maxdepth 1 ! -name '.htaccess' -exec rm -rf {{}} +",
        timeout=120,
    )

    command = f"mkdir -p {shlex.quote(static_dir)} && tar -xzf - -C {shlex.quote(static_dir)}"
    if cfg.get("static_frontend_owner"):
        command += f" && chown -R {shlex.quote(cfg['static_frontend_owner'])} {shlex.quote(static_dir)}"

    emit(f">>> {command}")
    stdin, stdout, stderr = remote.client.exec_command(command, timeout=1200)
    stdin.channel.sendall(frontend_archive.getvalue())
    stdin.channel.shutdown_write()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    emit(out)
    emit(err, stream=sys.stderr)
    if code != 0:
        raise RuntimeError(f"Static frontend extraction failed ({code})")

    return backup_path


def deploy(args: argparse.Namespace) -> None:
    cfg, config_path = resolve_config(args)
    verify_worktree(allow_dirty=args.allow_dirty, skip_push=args.skip_push)

    branch = run_local(["git", "branch", "--show-current"], capture=True)
    commit_short = run_local(["git", "rev-parse", "--short", "HEAD"], capture=True)
    commit_full = run_local(["git", "rev-parse", "HEAD"], capture=True)
    tracked_files = list_tracked_files()
    compose_base = build_compose_base(cfg)

    emit(f"Config: {config_path if config_path.exists() else 'env only'}")
    emit(f"Branch: {branch}")
    emit(f"Commit: {commit_short}")
    emit(f"Mode: {args.mode}")
    emit(f"Files to sync: {len(tracked_files)}")
    emit(f"Push remotes: {', '.join(cfg['push_remotes']) if cfg['push_remotes'] else 'none'}")
    emit(f"Static frontend dir: {cfg['static_frontend_dir'] or 'disabled'}")

    maybe_push(branch, cfg["push_remotes"], dry_run=args.dry_run or args.skip_push)

    archive = create_repo_archive(tracked_files)
    emit(f"Archive size: {len(archive.getbuffer())} bytes")

    frontend_archive = None
    if cfg["static_frontend_dir"]:
        emit("Local frontend build: npm run build")
        if not args.dry_run:
            run_local(["npm", "run", "build"])
        frontend_archive = create_directory_archive(ROOT / "dist")
        emit(f"Frontend archive size: {len(frontend_archive.getbuffer())} bytes")

    if args.dry_run:
        emit("Dry run complete. No remote changes were applied.")
        return

    with RemoteSession(cfg) as remote:
        remote.extract_archive(archive)
        release_marker = posixpath.join(
            cfg["base_dir"], "deploy", "releases", f"{time.strftime('%Y%m%d-%H%M%S')}-{commit_short}.txt"
        )
        remote.run(
            f"mkdir -p {shlex.quote(posixpath.dirname(release_marker))} && "
            f"printf '%s\\n' "
            f"{shlex.quote(f'commit={commit_full}')} "
            f"{shlex.quote(f'branch={branch}')} "
            f"{shlex.quote(f'mode={args.mode}')} "
            f"{shlex.quote(f'config={config_path.name}')} "
            f"> {shlex.quote(release_marker)}",
            timeout=60,
        )

        backup_path = ""
        if not args.skip_backup:
            backup_path = backup_database(remote, cfg, commit_short, dry_run=False)

        remote.run(
            f"systemctl stop {shlex.quote(cfg['legacy_service_name'])}",
            timeout=60,
            check=False,
        )

        if args.mode == "reseed":
            if not args.confirm_reseed:
                die("Reseed mode is destructive. Rerun with --confirm-reseed.")
            remote.run(f"{compose_base} down -v", timeout=300, check=False)
            remote.run(f"{compose_base} build app db", timeout=1800)
            remote.run(f"{compose_base} up -d db", timeout=300)
            wait_for_health(remote, cfg["db_container_name"], seconds=240)
            remote.run(f"{compose_base} up -d app", timeout=300)
        else:
            remote.run(f"{compose_base} build app", timeout=1800)
            remote.run(f"{compose_base} up -d app", timeout=300)

        wait_for_health(remote, cfg["app_container_name"], seconds=240)
        verify_application(remote, cfg, dry_run=False)

        frontend_backup_path = ""
        if cfg["static_frontend_dir"] and frontend_archive is not None:
            frontend_backup_path = sync_static_frontend(remote, cfg, commit_short, frontend_archive)

        if backup_path:
            emit(f"Backup created: {backup_path}")
        if frontend_backup_path:
            emit(f"Frontend backup created: {frontend_backup_path}")
        emit(f"Release marker: {release_marker}")

    emit("Deployment completed successfully.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reusable VPS deployment for the Docker-based production stack."
    )
    parser.add_argument(
        "--config",
        help=f"Path to deployment config JSON. Defaults to {DEFAULT_CONFIG_PATH.name}.",
    )
    parser.add_argument(
        "--mode",
        choices=["app", "reseed"],
        default="app",
        help="app: sync + rebuild app only. reseed: rebuild db and app with volume reset.",
    )
    parser.add_argument(
        "--push-remote",
        action="append",
        help="Push branch to this git remote before remote deployment. Can be passed multiple times.",
    )
    parser.add_argument(
        "--skip-push",
        action="store_true",
        help="Skip git push before VPS deployment.",
    )
    parser.add_argument(
        "--skip-backup",
        action="store_true",
        help="Skip the pre-deploy database dump.",
    )
    parser.add_argument(
        "--allow-dirty",
        action="store_true",
        help="Allow deploying a dirty working tree. Must be used with --skip-push.",
    )
    parser.add_argument(
        "--confirm-reseed",
        action="store_true",
        help="Required with --mode reseed because it resets Docker volumes.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate config and local git state without touching the VPS.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    deploy(parse_args())
