import chalk from "chalk";
import pidusage from "pidusage";
import psList from "ps-list";
import { dispatchAlerts } from "./alerts";
import { SentinelConfig } from "./config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessRow {
  target: string;
  pid: number | null;
  status: "NOMINAL" | "ALERT" | "CRASHED" | "NOT_FOUND" | string;
  cpu: number;
  mem: number;
  uptime: number; // ms since watch started
  startTime: number;
  lastAlertTime: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function formatMem(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1) + "MB";
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h${String(m % 60).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}m${String(s % 60).padStart(2, "0")}s`;
}

function pad(str: string, len: number): string {
  return str.padEnd(len, " ").slice(0, len);
}

async function resolvePid(target: string): Promise<number | null> {
  if (/^\d+$/.test(target)) return parseInt(target, 10);
  const list = await psList();
  const match = list.find((p) =>
    p.name.toLowerCase().includes(target.toLowerCase())
  );
  return match ? match.pid : null;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderDashboard(rows: ProcessRow[], renderCount: number) {
  const lines: string[] = [];

  lines.push(chalk.hex("#404040")("─".repeat(72)));
  lines.push(
    chalk.bold.white("  SENTINEL") +
    chalk.hex("#404040")("  //  ") +
    chalk.hex("#FF5F1F")("MULTI-PROCESS DASHBOARD") +
    chalk.hex("#404040")("  //  v1.0.0")
  );
  lines.push(
    chalk.hex("#404040")(`  TICK: ${String(renderCount).padStart(6, "0")}`) +
    chalk.hex("#404040")(`   TIME: ${timestamp()}`)
  );
  lines.push(chalk.hex("#404040")("─".repeat(72)));
  lines.push(
    chalk.hex("#404040")(
      "  " +
      pad("PROCESS", 18) +
      pad("PID", 8) +
      pad("STATUS", 10) +
      pad("CPU", 10) +
      pad("MEM", 12) +
      "UPTIME"
    )
  );
  lines.push(chalk.hex("#404040")("─".repeat(72)));

  for (const row of rows) {
    const pidStr = row.pid ? String(row.pid) : "—";
    const cpuStr = row.pid ? row.cpu.toFixed(1) + "%" : "—";
    const memStr = row.pid ? formatMem(row.mem) : "—";
    const uptimeStr = formatUptime(row.uptime);

    let statusLabel: string = chalk.hex("#404040")("UNKNOWN  ");
    let cpuFormatted: string = chalk.hex("#404040")(pad("—", 10));

    switch (row.status) {
      case "NOMINAL":
        statusLabel = chalk.hex("#00FF41")("NOMINAL  ");
        cpuFormatted = chalk.hex("#E5E5E5")(pad(cpuStr, 10));
        break;
      case "ALERT":
        statusLabel = chalk.hex("#FF5F1F")("ALERT    ");
        cpuFormatted = chalk.hex("#FF5F1F")(pad(cpuStr, 10));
        break;
      case "CRASHED":
        statusLabel = chalk.hex("#FF5F1F")("CRASHED  ");
        cpuFormatted = chalk.hex("#404040")(pad("—", 10));
        break;
      case "NOT_FOUND":
        statusLabel = chalk.hex("#404040")("NOT_FOUND");
        cpuFormatted = chalk.hex("#404040")(pad("—", 10));
        break;
    }

    lines.push(
      "  " +
      chalk.hex("#E5E5E5")(pad(row.target, 18)) +
      chalk.hex("#404040")(pad(pidStr, 8)) +
      statusLabel + " " +
      cpuFormatted +
      chalk.hex("#E5E5E5")(pad(memStr, 12)) +
      chalk.hex("#404040")(uptimeStr)
    );
  }

  lines.push(chalk.hex("#404040")("─".repeat(72)));
  lines.push(
    chalk.hex("#404040")("  Press Ctrl+C to stop watching.")
  );

  return lines;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runDashboard(
  targets: string[],
  config: SentinelConfig,
  cpuThreshold: number,
  intervalMs: number
) {
  const ALERT_COOLDOWN_MS = 60_000;

  // Initialise rows
  const rows: ProcessRow[] = targets.map((t) => ({
    target: t,
    pid: null,
    status: "NOT_FOUND",
    cpu: 0,
    mem: 0,
    uptime: 0,
    startTime: Date.now(),
    lastAlertTime: 0,
  }));

  // First PID resolution
  for (const row of rows) {
    row.pid = await resolvePid(row.target);
    if (!row.pid) row.status = "NOT_FOUND";
  }

  let renderCount = 0;
  let lastLineCount = 0;

  const render = (lines: string[]) => {
    // Move cursor up by lastLineCount to overwrite previous frame
    if (lastLineCount > 0) {
      process.stdout.write(`\x1B[${lastLineCount}A`);
    }
    const output = lines.map((l) => l + "\x1B[K").join("\n") + "\n";
    process.stdout.write(output);
    lastLineCount = lines.length;
  };

  const tick = async () => {
    renderCount++;

    for (const row of rows) {
      if (row.status === "CRASHED") continue;

      // Re-resolve if not found yet
      if (!row.pid) {
        row.pid = await resolvePid(row.target);
        if (!row.pid) { row.status = "NOT_FOUND"; continue; }
      }

      try {
        const stats = await pidusage(row.pid);
        row.cpu = stats.cpu;
        row.mem = stats.memory;
        row.uptime = Date.now() - row.startTime;

        const isAlert = row.cpu > cpuThreshold;
        row.status = isAlert ? "ALERT" : "NOMINAL";

        if (isAlert && Date.now() - row.lastAlertTime > ALERT_COOLDOWN_MS) {
          row.lastAlertTime = Date.now();
          await dispatchAlerts(config, {
            type: "cpu",
            target: row.target,
            pid: row.pid,
            value: row.cpu.toFixed(1) + "%",
            threshold: `${cpuThreshold}%`,
            uptime: Math.floor(row.uptime / 1000),
            timestamp: timestamp(),
          });
        }
      } catch {
        // Process died
        if ((row.status as string) !== "CRASHED") {
          row.status = "CRASHED";
          row.uptime = Date.now() - row.startTime;
          await dispatchAlerts(config, {
            type: "crash",
            target: row.target,
            pid: row.pid,
            uptime: Math.floor(row.uptime / 1000),
            timestamp: timestamp(),
          });
        }
      }
    }

    const lines = renderDashboard(rows, renderCount);
    render(lines);
  };

  // Initial render before first tick
  const initLines = renderDashboard(rows, 0);
  process.stdout.write(initLines.join("\n") + "\n");
  lastLineCount = initLines.length;

  const timer = setInterval(tick, intervalMs);

  process.on("SIGINT", () => {
    clearInterval(timer);
    process.stdout.write(
      chalk.hex("#404040")("\n  [--]  Dashboard terminated.\n\n")
    );
    process.exit(0);
  });
}
