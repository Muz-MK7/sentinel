# SENTINEL

Real-time process and server health monitor for engineers who can't afford surprises.

```
──────────────────────────────────────────────────────────────
  SENTINEL  //  PROCESS WATCH  //  v1.0.0
──────────────────────────────────────────────────────────────
  TARGET  : nginx               PID : 1842
  STARTED : 2026-03-13 10:00:00Z
──────────────────────────────────────────────────────────────
  TIMESTAMP             STATUS    CPU       MEM         UPTIME
──────────────────────────────────────────────────────────────
  2026-03-13 10:00:01Z  NOMINAL 12.0%     244.0MB     00m01s
  2026-03-13 10:00:02Z  ALERT   83.0%     245.0MB     00m02s

  [ALERT] CPU threshold breached — 83.0% > 80%

  2026-03-13 10:00:03Z  NOMINAL 14.0%     244.0MB     00m03s
```

## Features

- **Process watch** — monitor any process by name or PID
- **Crash detection** — instant alert when a process dies
- **CPU threshold alerts** — get notified when CPU spikes
- **Multi-process dashboard** — watch your entire stack at once
- **Slack & webhook alerts** — fire notifications to any channel
- **Config file** — TOML-based config, no flags required

## Install

```bash
npm install -g sentinel-cli
```

## Usage

**Watch a single process:**
```bash
sentinel watch nginx
sentinel watch node
sentinel watch 1842        # by PID
```

**Watch multiple processes (live dashboard):**
```bash
sentinel watch nginx postgres node
```

**With options:**
```bash
sentinel watch nginx -t 50     # alert when CPU > 50%
sentinel watch nginx -i 2      # poll every 2 seconds
```

**Generate a config file:**
```bash
sentinel init
```

## Config File

Run `sentinel init` to generate `sentinel.config.toml`:

```toml
# CPU alert threshold (%)
threshold = 80

# Poll interval in seconds
interval = 1

# Slack webhook URL (optional)
# slack_webhook = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Generic webhook URL (optional)
# webhook = "https://your-endpoint.com/alerts"
```

Config is loaded automatically from the current directory or `~/.sentinel/sentinel.config.toml`.

## Alert Channels

SENTINEL fires alerts on:
- **Crash** — process has died
- **CPU breach** — CPU exceeded threshold (1 alert per minute max)

Supported channels: `stdout`, `Slack webhook`, `generic webhook`

## License

MIT
