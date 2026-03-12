"use client";

import { useEffect, useRef, useState } from "react";

// ─── Cursor ───────────────────────────────────────────────────────────────────
function Cursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      className="fixed z-[9998] pointer-events-none select-none"
      style={{ left: pos.x + 16, top: pos.y + 4 }}
    >
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "9px",
          color: "#FF5F1F",
          letterSpacing: "0.05em",
          opacity: 0.8,
          whiteSpace: "nowrap",
        }}
      >
        X:{String(pos.x).padStart(4, "0")} Y:{String(pos.y).padStart(4, "0")}
      </span>
    </div>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => setTime(new Date().toISOString().replace("T", " ").slice(0, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span>{time}Z</span>;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const step = Math.ceil(target / 40);
        const id = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(id); }
          else setVal(start);
        }, 30);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Separator ────────────────────────────────────────────────────────────────
function Sep({ label }: { label?: string }) {
  return (
    <div className="diamond-sep my-0">
      {label && <span className="text-[10px] tracking-[0.2em] uppercase text-[#404040]">{label}</span>}
      {!label && <span className="text-[#404040]">◆</span>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge() {
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 border border-[#00FF41] px-3 py-1 chamfered-sm">
      <span
        className="w-1.5 h-1.5 rounded-full bg-[#00FF41]"
        style={{ opacity: blink ? 1 : 0.2, transition: "opacity 0.3s linear" }}
      />
      <span className="text-[#00FF41] text-[10px] tracking-[0.2em] uppercase font-mono">
        Status: Active
      </span>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  serial,
  title,
  desc,
  spec,
}: {
  serial: string;
  title: string;
  desc: string;
  spec: string;
}) {
  return (
    <div className="relative border border-[#404040] border-l-4 border-l-[#FF5F1F] bg-[#0D0D0D] p-6 group">
      <div className="text-[10px] text-[#404040] tracking-[0.2em] mb-4 font-mono">{serial}</div>
      <h3
        className="text-[#E5E5E5] text-lg font-bold uppercase tracking-[0.15em] mb-3"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {title}
      </h3>
      <p className="text-[#707070] text-sm leading-relaxed font-mono mb-6">{desc}</p>
      <div className="border-t border-[#262626] pt-4">
        <span className="text-[10px] text-[#404040] tracking-[0.15em] font-mono">{spec}</span>
      </div>
      {/* corner notch */}
      <div
        className="absolute top-0 right-0 w-3 h-3 bg-[#FF5F1F]"
        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
      />
    </div>
  );
}

// ─── Install Step ─────────────────────────────────────────────────────────────
function InstallStep({ n, cmd, comment }: { n: string; cmd: string; comment: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-[#262626] bg-[#0D0D0D]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626]">
        <span className="text-[10px] text-[#404040] tracking-[0.2em] font-mono">STEP_{n}</span>
        <span className="text-[10px] text-[#404040] tracking-[0.15em] font-mono">{comment}</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <code className="text-[#00FF41] text-sm font-mono">{cmd}</code>
        <button
          onClick={copy}
          className="text-[10px] tracking-[0.15em] font-mono border border-[#404040] px-2 py-1 text-[#404040] hover:border-[#FF5F1F] hover:text-[#FF5F1F] transition-colors duration-50 cursor-crosshair"
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="blueprint-grid scanlines min-h-screen">
      <Cursor />

      {/* Left margin metadata */}
      <div
        className="fixed left-0 top-0 bottom-0 w-10 border-r border-[#262626] z-40 hidden lg:flex flex-col items-center justify-center gap-4"
        style={{ background: "#0D0D0D" }}
      >
        <div
          className="text-[9px] text-[#404040] tracking-[0.25em] font-mono whitespace-nowrap"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          SERIAL_NO: SNT-2025-001
        </div>
        <div className="w-px h-8 bg-[#262626]" />
        <div
          className="text-[9px] text-[#404040] tracking-[0.25em] font-mono whitespace-nowrap"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          DATE_STAMP: 2025.03.12
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-10">

        {/* ── Nav ── */}
        <nav className="border-b border-[#262626] px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative glitch-parent">
              <span
                className="text-[#E5E5E5] text-sm font-bold tracking-[0.3em] uppercase"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                SENTINEL
              </span>
              <span className="glitch-layer" aria-hidden="true">SENTINEL</span>
            </div>
            <span className="text-[10px] text-[#404040] font-mono tracking-[0.15em] hidden sm:block">
              v2.4.1
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[10px] text-[#404040] font-mono hidden md:block">
              <LiveClock />
            </span>
            <StatusBadge />
            <a
              href="#install"
              className="chamfered-sm bg-[#FF5F1F] text-black text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2 hover:bg-[#E5E5E5] transition-colors duration-50 cursor-crosshair"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              DEPLOY
            </a>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="px-6 lg:px-12 pt-20 pb-16 relative overflow-hidden">
          {/* Coordinate label */}
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-8">
            [40.7128° N, 74.0060° W] — SECTOR_GRID: 04-A
          </div>

          <div className="max-w-5xl">
            <div className="mb-6">
              <StatusBadge />
            </div>

            <h1
              className="text-5xl lg:text-7xl font-bold uppercase text-[#E5E5E5] leading-none mb-6"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                letterSpacing: "0.12em",
              }}
            >
              MONITOR
              <br />
              <span className="text-[#FF5F1F]">EVERYTHING.</span>
              <br />
              MISS
              <br />
              NOTHING.
            </h1>

            <p className="text-[#707070] text-sm font-mono leading-relaxed max-w-xl mb-10 tracking-wide">
              SENTINEL is a real-time process and server health monitor for engineers
              who can&apos;t afford surprises. Every event is timestamped, archived,
              and surfaced at the exact moment it matters.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#install"
                className="chamfered bg-[#FF5F1F] text-black text-xs font-bold tracking-[0.25em] uppercase px-8 py-4 hover:bg-[#E5E5E5] transition-colors duration-50 cursor-crosshair"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                GET SENTINEL
              </a>
              <a
                href="#features"
                className="chamfered border-2 border-[#404040] text-[#E5E5E5] text-xs font-bold tracking-[0.25em] uppercase px-8 py-4 hover:border-[#FF5F1F] hover:text-[#FF5F1F] transition-colors duration-50 cursor-crosshair"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                VIEW SPEC
              </a>
            </div>
          </div>

          {/* Hero stat strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#262626] mt-20 border border-[#262626]">
            {[
              { val: 9998, suffix: "%", label: "UPTIME_AVG" },
              { val: 12000, suffix: "+", label: "PROCESSES_WATCHED" },
              { val: 4, suffix: "ms", label: "AVG_ALERT_LATENCY" },
              { val: 3, suffix: " platforms", label: "OS_SUPPORT" },
            ].map((s) => (
              <div key={s.label} className="bg-[#0D0D0D] px-6 py-6">
                <div
                  className="text-3xl font-bold text-[#FF5F1F] mb-1"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <Counter target={s.val} suffix={s.suffix} />
                </div>
                <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em]">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="px-6 lg:px-12">
          <Sep label="SECTION_02 — CAPABILITIES" />
        </div>

        {/* ── Features ── */}
        <section id="features" className="px-6 lg:px-12 py-16">
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-10">
            [51.5074° N, 0.1278° W] — CAPABILITY_MATRIX
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262626]">
            <FeatureCard
              serial="CAP-001 // PROCESS_WATCH"
              title="Process Surveillance"
              desc="Attach to any running process by PID, name, or pattern. SENTINEL records CPU, memory, and I/O deltas at configurable intervals — no agents required."
              spec="POLL_INTERVAL: 250ms — 60s // FORMAT: JSON, CSV, NDJSON"
            />
            <FeatureCard
              serial="CAP-002 // ALERT_ENGINE"
              title="Threshold Alerts"
              desc="Define breach conditions in plain TOML. When a process crosses your line, SENTINEL fires to Slack, PagerDuty, webhooks, or stdout. No GUI. No fluff."
              spec="ALERT_LATENCY: ≤4ms // CHANNELS: webhook, stdout, file"
            />
            <FeatureCard
              serial="CAP-003 // ARCHIVE_LAYER"
              title="Immutable Event Log"
              desc="Every observation is appended to a structured log. Logs are append-only, timestamped to microsecond precision, and queryable via the built-in SENTINEL query language."
              spec="LOG_FORMAT: NDJSON // COMPRESSION: zstd // RETENTION: configurable"
            />
            <FeatureCard
              serial="CAP-004 // NETWORK_PROBE"
              title="Port & Socket Watch"
              desc="Monitor open ports, active connections, and socket states. SENTINEL flags unexpected listeners and dropped connections before your load balancer does."
              spec="PROTO: TCP, UDP, UNIX // SCAN_DEPTH: L4"
            />
            <FeatureCard
              serial="CAP-005 // DIFF_ENGINE"
              title="Config Drift Detection"
              desc="Hash-watch critical config files and environment variables. Any mutation triggers a diff report — stamped, signed, and logged against the last known-good state."
              spec="HASH: SHA-256 // WATCH_DEPTH: recursive // ENV_SCAN: true"
            />
            <FeatureCard
              serial="CAP-006 // REPORT_GEN"
              title="Manifest Export"
              desc="Generate timestamped health reports on demand or on schedule. Outputs are machine-readable by default, human-readable with the --render flag."
              spec="OUTPUT: JSON, HTML, PDF // SCHEDULE: cron syntax"
            />
          </div>
        </section>

        <div className="px-6 lg:px-12">
          <Sep label="SECTION_03 — INSTALLATION" />
        </div>

        {/* ── Install ── */}
        <section id="install" className="px-6 lg:px-12 py-16">
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-10">
            [35.6762° N, 139.6503° E] — DEPLOYMENT_SEQUENCE
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2
                className="text-3xl font-bold uppercase text-[#E5E5E5] tracking-[0.15em] mb-4"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                DEPLOY IN
                <br />
                <span className="text-[#FF5F1F]">30 SECONDS.</span>
              </h2>
              <p className="text-[#707070] text-sm font-mono leading-relaxed">
                No configuration required to start. SENTINEL ships with sane defaults.
                Tune it when you need to.
              </p>
            </div>

            <div className="space-y-px">
              <InstallStep
                n="01"
                cmd="npm install -g @sentinel-cli/core"
                comment="// INSTALL_GLOBAL"
              />
              <InstallStep
                n="02"
                cmd="sentinel init"
                comment="// INITIALIZE_CONFIG"
              />
              <InstallStep
                n="03"
                cmd="sentinel watch --all"
                comment="// BEGIN_SURVEILLANCE"
              />
            </div>
          </div>

          {/* Terminal mockup */}
          <div className="mt-12 border border-[#262626] bg-[#0D0D0D]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262626]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F1F] opacity-60" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#404040]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#404040]" />
              <span className="text-[10px] text-[#404040] font-mono tracking-[0.2em] ml-2">
                SENTINEL_TERMINAL — bash
              </span>
            </div>
            <div className="p-6 font-mono text-sm space-y-2">
              <div>
                <span className="text-[#FF5F1F]">sentinel</span>
                <span className="text-[#E5E5E5]"> watch --pid 1842 --threshold cpu:80</span>
              </div>
              <div className="text-[#404040]"># Attaching to PID 1842 (node)...</div>
              <div className="text-[#404040]"># Config loaded: ~/.sentinel/config.toml</div>
              <div className="text-[#E5E5E5]">
                <span className="text-[#00FF41]">[OK]</span> Process found — node v20.11.0
              </div>
              <div className="text-[#E5E5E5]">
                <span className="text-[#00FF41]">[OK]</span> Watching: CPU, MEM, I/O, NET
              </div>
              <div className="text-[#E5E5E5] mt-2">
                <span className="text-[#404040]">2025-03-12T14:22:01Z</span>{" "}
                <span className="text-[#00FF41]">NOMINAL</span>{" "}
                cpu=12% mem=244MB io=1.2MB/s
              </div>
              <div className="text-[#E5E5E5]">
                <span className="text-[#404040]">2025-03-12T14:22:02Z</span>{" "}
                <span className="text-[#00FF41]">NOMINAL</span>{" "}
                cpu=14% mem=245MB io=0.9MB/s
              </div>
              <div className="text-[#E5E5E5]">
                <span className="text-[#404040]">2025-03-12T14:22:03Z</span>{" "}
                <span className="text-[#FF5F1F]">ALERT </span>{" "}
                cpu=<span className="text-[#FF5F1F]">83%</span> — threshold breached
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[#E5E5E5]">▋</span>
              </div>
            </div>
          </div>
        </section>

        <div className="px-6 lg:px-12">
          <Sep label="SECTION_04 — TECHNICAL_SPEC" />
        </div>

        {/* ── Spec Table ── */}
        <section className="px-6 lg:px-12 py-16">
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-10">
            [48.8566° N, 2.3522° E] — TECHNICAL_MANIFEST
          </div>

          <div className="border border-[#262626]">
            {[
              ["PLATFORM", "Linux, macOS, Windows (WSL2)"],
              ["RUNTIME", "Node.js ≥18 / Bun ≥1.0"],
              ["INSTALL_SIZE", "4.2 MB (no native deps)"],
              ["LOG_FORMAT", "NDJSON (append-only)"],
              ["CONFIG_FORMAT", "TOML"],
              ["ALERT_CHANNELS", "stdout, file, webhook, Slack, PagerDuty"],
              ["COMPRESSION", "zstd (default), gzip, none"],
              ["LICENSE", "MIT"],
            ].map(([key, val], i) => (
              <div
                key={key}
                className={`grid grid-cols-2 px-6 py-4 font-mono text-sm ${i % 2 === 0 ? "bg-[#0D0D0D]" : "bg-[#111111]"} border-b border-[#1a1a1a] last:border-b-0`}
              >
                <span className="text-[#404040] tracking-[0.15em] text-[11px] uppercase">{key}</span>
                <span className="text-[#E5E5E5] text-[12px]">{val}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="px-6 lg:px-12">
          <Sep label="SECTION_05 — FINAL_CTA" />
        </div>

        {/* ── CTA ── */}
        <section className="px-6 lg:px-12 py-20 text-center">
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-8 text-left">
            [37.7749° N, 122.4194° W] — CALL_TO_ACTION
          </div>
          <h2
            className="text-4xl lg:text-6xl font-bold uppercase text-[#E5E5E5] tracking-[0.15em] mb-6"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            YOUR STACK IS
            <br />
            <span className="text-[#FF5F1F]">ALREADY TALKING.</span>
            <br />
            ARE YOU LISTENING?
          </h2>
          <p className="text-[#707070] text-sm font-mono mb-12 max-w-lg mx-auto leading-relaxed">
            Deploy SENTINEL in 30 seconds. No account. No telemetry. No noise.
            Just signal.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#install"
              className="chamfered bg-[#FF5F1F] text-black text-xs font-bold tracking-[0.25em] uppercase px-10 py-5 hover:bg-[#E5E5E5] transition-colors duration-50 cursor-crosshair"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              DEPLOY NOW — FREE
            </a>
            <a
              href="#"
              className="chamfered border-2 border-[#404040] text-[#E5E5E5] text-xs font-bold tracking-[0.25em] uppercase px-10 py-5 hover:border-[#FF5F1F] hover:text-[#FF5F1F] transition-colors duration-50 cursor-crosshair"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              READ THE DOCS
            </a>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-[#262626] px-6 lg:px-12 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[10px] text-[#404040] tracking-[0.15em]">
            <div className="flex items-center gap-4">
              <span
                className="text-[#E5E5E5] font-bold tracking-[0.3em] uppercase text-xs"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                SENTINEL
              </span>
              <Sep />
              <span>MIT LICENSE</span>
              <Sep />
              <span>SNT-2025-001</span>
            </div>
            <div className="flex items-center gap-4">
              <span>GITHUB</span>
              <Sep />
              <span>CHANGELOG</span>
              <Sep />
              <span>
                <LiveClock />
              </span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
