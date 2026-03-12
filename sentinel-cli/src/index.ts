#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import pidusage from "pidusage";
import psList from "ps-list";
import fs from "fs";
import path from "path";
import { loadConfig } from "./config";
import { dispatchAlerts } from "./alerts";
import { runDashboard } from "./dashboard";

const program = new Command();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function formatMem(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1) + "MB";
}

function pad(str: string, len: number): string {
  return str.padEnd(len, " ").slice(0, len);
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h${String(m % 60).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}m${String(s % 60).padStart(2, "0")}s`;
}

async function findPid(target: string): Promise<number | null> {
  if (/^\d+$/.test(target)) return parseInt(target, 10);
  const list = await psList();
  const match = list.find((p) =>
    p.name.toLowerCase().includes(target.toLowerCase())
  );
  return match ? match.pid : null;
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function printBanner(target: string, pid: number) {
  console.clear();
  console.log(chalk.hex("#404040")("─".repeat(62)));
  console.log(
    chalk.bold.white("  SENTINEL") +
      chalk.hex("#404040")("  //  ") +
      chalk.hex("#FF5F1F")("PROCESS WATCH") +
      chalk.hex("#404040")("  //  v1.0.0")
  );
  console.log(chalk.hex("#404040")("─".repeat(62)));
  console.log(
    chalk.hex("#404040")("  TARGET  : ") +
      chalk.white(pad(target, 20)) +
      chalk.hex("#404040")("PID : ") +
      chalk.white(String(pid))
  );
  console.log(
    chalk.hex("#404040")("  STARTED : ") + chalk.hex("#404040")(timestamp())
  );
  console.log(chalk.hex("#404040")("─".repeat(62)));
  console.log(
    chalk.hex("#404040")(
      "  " +
        pad("TIMESTAMP", 22) +
        pad("STATUS", 10) +
        pad("CPU", 10) +
        pad("MEM", 12) +
        "UPTIME"
    )
  );
  console.log(chalk.hex("#404040")("─".repeat(62)));
}

// ─── Init Command ─────────────────────────────────────────────────────────────

function initConfig() {
  const dest = path.join(process.cwd(), "sentinel.config.toml");
  if (fs.existsSync(dest)) {
    console.log(
      chalk.hex("#FF5F1F")("\n  [--]  sentinel.config.toml already exists.\n")
    );
    return;
  }
  const template = `# SENTINEL CONFIG
# Generated: ${timestamp()}

# CPU alert threshold (%)
threshold = 80

# Poll interval in seconds
interval = 1

# Slack webhook URL (optional)
# slack_webhook = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Generic webhook URL (optional)
# webhook = "https://your-endpoint.com/alerts"
`;
  fs.writeFileSync(dest, template, "utf-8");
  console.log(chalk.hex("#00FF41")("\n  [OK]  sentinel.config.toml created.\n"));
  console.log(
    chalk.hex("#404040")("  Edit the file to configure thresholds and alert channels.\n")
  );
}

// ─── Watch Command ────────────────────────────────────────────────────────────

async function watch(
  targets: string[],
  options: { interval?: string; threshold?: string }
) {
  const fileConfig = loadConfig();
  const intervalMs =
    parseInt(options.interval ?? String(fileConfig.interval ?? 1), 10) * 1000;
  const cpuThreshold = parseInt(
    options.threshold ?? String(fileConfig.threshold ?? 80),
    10
  );

  // Multi-process: use dashboard
  if (targets.length > 1) {
    console.log(
      chalk.hex("#404040")(
        `\n  Starting dashboard for ${targets.length} processes...\n`
      )
    );
    await new Promise((r) => setTimeout(r, 600));
    await runDashboard(targets, fileConfig, cpuThreshold, intervalMs);
    return;
  }

  // Single process: use scrolling log view
  const target = targets[0];
  console.log(chalk.hex("#404040")(`\n  Attaching to "${target}"...`));

  const pid = await findPid(target);
  if (!pid) {
    console.log(
      chalk.hex("#FF5F1F")(
        `\n  [ERR] Process "${target}" not found. Is it running?\n`
      )
    );
    process.exit(1);
  }

  console.log(chalk.hex("#00FF41")(`  [OK]  Found — PID ${pid}`));
  console.log(chalk.hex("#00FF41")(`  [OK]  Watching: CPU, MEM`));
  console.log(
    chalk.hex("#404040")(`  [--]  CPU alert threshold: ${cpuThreshold}%`)
  );
  if (fileConfig.slack_webhook)
    console.log(chalk.hex("#00FF41")(`  [OK]  Slack alerts: enabled`));
  if (fileConfig.webhook)
    console.log(chalk.hex("#00FF41")(`  [OK]  Webhook alerts: enabled`));

  await new Promise((r) => setTimeout(r, 800));
  printBanner(target, pid);

  const startTime = Date.now();
  let crashed = false;
  let lastAlertTime = 0;
  const ALERT_COOLDOWN_MS = 60_000;

  const tick = async () => {
    try {
      const stats = await pidusage(pid);
      const uptime = formatUptime(Date.now() - startTime);
      const cpu = stats.cpu.toFixed(1) + "%";
      const mem = formatMem(stats.memory);
      const ts = timestamp();
      const isAlert = stats.cpu > cpuThreshold;

      const status = isAlert
        ? chalk.hex("#FF5F1F")("ALERT ")
        : chalk.hex("#00FF41")("NOMINAL");
      const cpuStr = isAlert
        ? chalk.hex("#FF5F1F")(pad(cpu, 10))
        : chalk.hex("#E5E5E5")(pad(cpu, 10));

      console.log(
        "  " +
          chalk.hex("#404040")(pad(ts, 22)) +
          status +
          " " +
          cpuStr +
          chalk.hex("#E5E5E5")(pad(mem, 12)) +
          chalk.hex("#404040")(uptime)
      );

      if (isAlert && Date.now() - lastAlertTime > ALERT_COOLDOWN_MS) {
        lastAlertTime = Date.now();
        console.log(
          chalk.hex("#FF5F1F")(
            `\n  [ALERT] CPU threshold breached — ${cpu} > ${cpuThreshold}%\n`
          )
        );
        await dispatchAlerts(fileConfig, {
          type: "cpu",
          target,
          pid,
          value: cpu,
          threshold: `${cpuThreshold}%`,
          uptime: Math.floor((Date.now() - startTime) / 1000),
          timestamp: ts,
        });
      }
    } catch {
      if (!crashed) {
        crashed = true;
        clearInterval(timer);
        const uptimeSec = Math.floor((Date.now() - startTime) / 1000);
        const ts = timestamp();
        console.log(chalk.hex("#404040")("─".repeat(62)));
        console.log(
          chalk.hex("#FF5F1F")(
            `\n  [CRASH] Process "${target}" (PID ${pid}) has died.`
          )
        );
        console.log(chalk.hex("#404040")(`  TIME   : ${ts}`));
        console.log(chalk.hex("#404040")(`  UPTIME : ${uptimeSec}s\n`));
        await dispatchAlerts(fileConfig, {
          type: "crash",
          target,
          pid,
          uptime: uptimeSec,
          timestamp: ts,
        });
        process.exit(1);
      }
    }
  };

  const timer = setInterval(tick, intervalMs);
  tick();

  process.on("SIGINT", () => {
    clearInterval(timer);
    console.log(
      chalk.hex("#404040")("\n\n  [--]  Watch terminated by user.\n")
    );
    process.exit(0);
  });
}

// ─── CLI Definition ───────────────────────────────────────────────────────────

program
  .name("sentinel")
  .description("Real-time process and server health monitor")
  .version("1.0.0");

program
  .command("watch <targets...>")
  .description("Watch one or more processes by name or PID")
  .option("-i, --interval <seconds>", "Poll interval in seconds")
  .option("-t, --threshold <percent>", "CPU alert threshold (%)")
  .action(watch);

program
  .command("init")
  .description("Create a sentinel.config.toml in the current directory")
  .action(initConfig);

program.parse(process.argv);
