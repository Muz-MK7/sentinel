import chalk from "chalk";

export interface AlertPayload {
  type: "crash" | "cpu" | "mem";
  target: string;
  pid: number;
  value?: string;
  threshold?: string;
  uptime: number;
  timestamp: string;
}

function buildSlackMessage(p: AlertPayload): object {
  const emoji = p.type === "crash" ? "💀" : "⚠️";
  const title =
    p.type === "crash"
      ? `SENTINEL CRASH ALERT — ${p.target} (PID ${p.pid})`
      : `SENTINEL CPU ALERT — ${p.target} (PID ${p.pid})`;
  const detail =
    p.type === "crash"
      ? `Process has died after ${p.uptime}s of uptime.`
      : `CPU usage hit ${p.value} (threshold: ${p.threshold})`;

  return {
    text: `${emoji} *${title}*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *${title}*\n${detail}`,
        },
        fields: [
          { type: "mrkdwn", text: `*Timestamp:*\n${p.timestamp}` },
          { type: "mrkdwn", text: `*Uptime:*\n${p.uptime}s` },
        ],
      },
    ],
  };
}

export async function sendSlackAlert(
  webhookUrl: string,
  payload: AlertPayload
): Promise<void> {
  try {
    const body = JSON.stringify(buildSlackMessage(payload));
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      console.log(chalk.hex("#00FF41")("  [OK]  Slack alert sent."));
    } else {
      console.log(chalk.hex("#FF5F1F")(`  [ERR] Slack alert failed: HTTP ${res.status}`));
    }
  } catch (err) {
    console.log(chalk.hex("#FF5F1F")(`  [ERR] Slack alert error: ${(err as Error).message}`));
  }
}

export async function sendWebhookAlert(
  webhookUrl: string,
  payload: AlertPayload
): Promise<void> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(chalk.hex("#00FF41")("  [OK]  Webhook alert sent."));
    } else {
      console.log(chalk.hex("#FF5F1F")(`  [ERR] Webhook alert failed: HTTP ${res.status}`));
    }
  } catch (err) {
    console.log(chalk.hex("#FF5F1F")(`  [ERR] Webhook error: ${(err as Error).message}`));
  }
}

export async function dispatchAlerts(
  config: { slack_webhook?: string; webhook?: string },
  payload: AlertPayload
): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (config.slack_webhook) tasks.push(sendSlackAlert(config.slack_webhook, payload));
  if (config.webhook) tasks.push(sendWebhookAlert(config.webhook, payload));
  await Promise.all(tasks);
}
