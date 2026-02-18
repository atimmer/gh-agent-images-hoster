# @24letters/agent-images

CLI for uploading immutable images to GH Agent Images Hoster.

## Install

```sh
pnpm add -g @24letters/agent-images
```

## Usage

```sh
gh-agent-images auth login --api <service-origin> --token <cli-token> --agent <default-agent-name>
```

```sh
gh-agent-images upload <file-path> --agent <agent-name> [--alt "alt text"]
```

The `upload` command prints markdown you can paste into GitHub pull requests.

## Install the Agent Skill

```sh
gh-agent-images install-skill
```

This delegates to [skills.sh](https://skills.sh/) and installs the `gh-agent-images-upload` skill from this repository.
