import fs from "fs";
import path from "path";
import TOML from "@iarna/toml";

export interface SentinelConfig {
  threshold?: number;
  interval?: number;
  slack_webhook?: string;
  webhook?: string;
}

const CONFIG_FILENAME = "sentinel.config.toml";

export function loadConfig(): SentinelConfig {
  const local = path.join(process.cwd(), CONFIG_FILENAME);
  const home = path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".sentinel",
    CONFIG_FILENAME
  );

  for (const location of [local, home]) {
    if (fs.existsSync(location)) {
      const raw = fs.readFileSync(location, "utf-8");
      return TOML.parse(raw) as SentinelConfig;
    }
  }

  return {};
}
