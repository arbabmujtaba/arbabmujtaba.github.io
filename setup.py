import os
import getpass
import subprocess

base_url = input("Agent Router Base URL: ").strip()
api_key = getpass.getpass("Agent Router API Key: ").strip()

shell = os.environ.get("SHELL", "")
if shell.endswith("/zsh"):
    config = os.path.expanduser("~/.zshrc")
elif shell.endswith("/bash"):
    config = os.path.expanduser("~/.bashrc")
else:
    config = os.path.expanduser("~/.bashrc")

# Remove old Claude/Agent Router entries
if os.path.exists(config):
    with open(config, "r") as f:
        lines = f.readlines()

    lines = [
        line for line in lines
        if not line.startswith("export ANTHROPIC_BASE_URL=")
        and not line.startswith("export ANTHROPIC_API_KEY=")
        and line.strip() != "# Claude Code / Agent Router"
    ]
else:
    lines = []

# Add new configuration
lines.append("\n# Claude Code / Agent Router\n")
lines.append(f'export ANTHROPIC_BASE_URL="{base_url}"\n')
lines.append(f'export ANTHROPIC_API_KEY="{api_key}"\n')

with open(config, "w") as f:
    f.writelines(lines)

os.chmod(config, 0o600)

print(f"\n✅ Claude Code credentials configured in {config}")
print("\nRun:")
print(f"source {config}")
print("\nThen verify:")
print("echo $ANTHROPIC_BASE_URL")
print("echo ${ANTHROPIC_API_KEY:0:8}********")
