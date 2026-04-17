"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
    <div className="relative border border-[#404040] border-l-4 border-l-[#FF5F1F] bg-[#0D0D0D] p-4 group">
      <div className="text-[10px] text-[#404040] tracking-[0.2em] mb-3 font-mono">{serial}</div>
      <h3
        className="text-[#E5E5E5] text-base font-bold uppercase tracking-[0.15em] mb-2"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {title}
      </h3>
      <p className="text-[#707070] text-xs leading-relaxed font-mono mb-4">{desc}</p>
      <div className="border-t border-[#262626] pt-3">
        <span className="text-[10px] text-[#404040] tracking-[0.15em] font-mono">{spec}</span>
      </div>
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

// ─── 2D Scroll types & config ──────────────────────────────────────────────────
type SectionId = "hero" | "features" | "spec" | "install" | "cta";

// [col, row] position on the 2D grid (2 cols × 3 rows)
const GRID: Record<SectionId, [number, number]> = {
  hero:     [0, 0],
  features: [1, 0],
  spec:     [1, 1],
  install:  [0, 1],
  cta:      [0, 2],
};

// Linear navigation path through the grid
const PATH: SectionId[] = ["hero", "features", "spec", "install", "cta"];

const SECTION_LABELS: Record<SectionId, string> = {
  hero:     "HERO",
  features: "CAPABILITIES",
  spec:     "TECH_SPEC",
  install:  "DEPLOYMENT",
  cta:      "FINAL_CTA",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [current, setCurrent] = useState(0);
  const lockRef = useRef(false);

  const navigate = useCallback((delta: number) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setCurrent((prev) => Math.max(0, Math.min(PATH.length - 1, prev + delta)));
    setTimeout(() => { lockRef.current = false; }, 900);
  }, []);

  // Wheel
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      navigate(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [navigate]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", " "].includes(e.key)) { e.preventDefault(); navigate(1); }
      if (["ArrowUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); navigate(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Touch swipe
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onEnd = (e: TouchEvent) => {
      if (!touchRef.current) return;
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      touchRef.current = null;
      if (Math.abs(dy) > Math.abs(dx)) {
        if (Math.abs(dy) > 40) navigate(dy < 0 ? 1 : -1);
      } else {
        if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1);
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [navigate]);

  const sectionId = PATH[current];
  const [col, row] = GRID[sectionId];

  // Direction hint: compare current and next section positions
  const nextId = current < PATH.length - 1 ? PATH[current + 1] : null;
  let dirHint = "";
  if (nextId) {
    const [nc, nr] = GRID[nextId];
    if (nc > col) dirHint = "→";
    else if (nc < col) dirHint = "←";
    else if (nr > row) dirHint = "↓";
    else dirHint = "↑";
  }

  return (
    <div className="fixed inset-0 overflow-hidden blueprint-grid scanlines">
      <Cursor />

      {/* ── Fixed left sidebar ── */}
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

      {/* ── Fixed Nav ── */}
      <nav className="fixed top-0 left-0 right-0 border-b border-[#262626] px-6 lg:px-12 lg:pl-14 py-4 flex items-center justify-between z-50 bg-[#0D0D0D]/95 backdrop-blur-sm">
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
          <button
            onClick={() => setCurrent(PATH.indexOf("install"))}
            className="chamfered-sm bg-[#FF5F1F] text-black text-[11px] font-bold tracking-[0.2em] uppercase px-4 py-2 hover:bg-[#E5E5E5] transition-colors duration-50 cursor-crosshair"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            DEPLOY
          </button>
        </div>
      </nav>

      {/* ── 2D Canvas (200vw × 300vh) ── */}
      <div
        style={{
          position: "absolute",
          width: "200vw",
          height: "300vh",
          transform: `translate(${-col * 100}vw, ${-row * 100}vh)`,
          transition: "transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)",
          willChange: "transform",
        }}
      >

        {/* ══ HERO [0,0] ══ */}
        <div
          style={{ position: "absolute", left: 0, top: 0, width: "100vw", height: "100vh" }}
          className="flex flex-col justify-center px-6 lg:px-12 lg:pl-16 pt-16 pb-4 overflow-hidden"
        >
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-6">
            [40.7128° N, 74.0060° W] — SECTOR_GRID: 04-A
          </div>
          <div className="mb-5">
            <StatusBadge />
          </div>
          <h1
            className="text-4xl lg:text-6xl font-bold uppercase text-[#E5E5E5] leading-none mb-5"
            style={{ fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.12em" }}
          >
            MONITOR
            <br />
            <span className="text-[#FF5F1F]">EVERYTHING.</span>
            <br />
            MISS NOTHING.
          </h1>
          <p className="text-[#707070] text-sm font-mono leading-relaxed max-w-xl mb-8 tracking-wide">
            SENTINEL is a real-time process and server health monitor for engineers
            who can&apos;t afford surprises. Every event is timestamped, archived,
            and surfaced at the exact moment it matters.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <button
              onClick={() => setCurrent(PATH.indexOf("install"))}
              className="chamfered bg-[#FF5F1F] text-black text-xs font-bold tracking-[0.25em] uppercase px-8 py-4 hover:bg-[#E5E5E5] transition-colors duration-50 cursor-crosshair"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              GET SENTINEL
            </button>
            <button
              onClick={() => setCurrent(PATH.indexOf("features"))}
              className="chamfered border-2 border-[#404040] text-[#E5E5E5] text-xs font-bold tracking-[0.25em] uppercase px-8 py-4 hover:border-[#FF5F1F] hover:text-[#FF5F1F] transition-colors duration-50 cursor-crosshair"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              VIEW SPEC
            </button>
          </div>
          {/* Stats strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#262626] border border-[#262626] max-w-2xl">
            {[
              { val: 9998, suffix: "%", label: "UPTIME_AVG" },
              { val: 12000, suffix: "+", label: "PROCESSES_WATCHED" },
              { val: 4, suffix: "ms", label: "AVG_ALERT_LATENCY" },
              { val: 3, suffix: " platforms", label: "OS_SUPPORT" },
            ].map((s) => (
              <div key={s.label} className="bg-[#0D0D0D] px-4 py-4">
                <div
                  className="text-2xl font-bold text-[#FF5F1F] mb-1"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <Counter target={s.val} suffix={s.suffix} />
                </div>
                <div className="text-[9px] text-[#404040] font-mono tracking-[0.2em]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ FEATURES [1,0] ══ */}
        <div
          style={{ position: "absolute", left: "100vw", top: 0, width: "100vw", height: "100vh" }}
          className="flex flex-col px-6 lg:px-12 lg:pl-16 pt-20 pb-6 overflow-hidden"
        >
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-5">
            [51.5074° N, 0.1278° W] — CAPABILITY_MATRIX
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#262626]"
            style={{ flex: 1, minHeight: 0 }}
          >
            <FeatureCard
              serial="CAP-001 // PROCESS_WATCH"
              title="Process Surveillance"
              desc="Attach to any running process by PID, name, or pattern. Records CPU, memory, and I/O deltas at configurable intervals — no agents required."
              spec="POLL_INTERVAL: 250ms–60s // FORMAT: JSON, CSV, NDJSON"
            />
            <FeatureCard
              serial="CAP-002 // ALERT_ENGINE"
              title="Threshold Alerts"
              desc="Define breach conditions in plain TOML. When a process crosses your line, fires to Slack, webhooks, or stdout. No GUI. No fluff."
              spec="ALERT_LATENCY: ≤4ms // CHANNELS: webhook, stdout, file"
            />
            <FeatureCard
              serial="CAP-003 // ARCHIVE_LAYER"
              title="Immutable Event Log"
              desc="Every observation is appended to a structured log. Logs are append-only, timestamped to microsecond precision."
              spec="LOG_FORMAT: NDJSON // COMPRESSION: zstd"
            />
            <FeatureCard
              serial="CAP-004 // NETWORK_PROBE"
              title="Port & Socket Watch"
              desc="Monitor open ports, active connections, and socket states. Flags unexpected listeners before your load balancer does."
              spec="PROTO: TCP, UDP, UNIX // SCAN_DEPTH: L4"
            />
            <FeatureCard
              serial="CAP-005 // DIFF_ENGINE"
              title="Config Drift Detection"
              desc="Hash-watch critical config files and env vars. Any mutation triggers a diff report — stamped and logged."
              spec="HASH: SHA-256 // WATCH_DEPTH: recursive"
            />
            <FeatureCard
              serial="CAP-006 // REPORT_GEN"
              title="Manifest Export"
              desc="Generate timestamped health reports on demand or on schedule. Machine-readable by default, human-readable with --render."
              spec="OUTPUT: JSON, HTML, PDF // SCHEDULE: cron"
            />
          </div>
        </div>

        {/* ══ SPEC [1,1] ══ */}
        <div
          style={{ position: "absolute", left: "100vw", top: "100vh", width: "100vw", height: "100vh" }}
          className="flex flex-col justify-center px-6 lg:px-12 lg:pl-16 pt-20 pb-6 overflow-hidden"
        >
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-6">
            [48.8566° N, 2.3522° E] — TECHNICAL_MANIFEST
          </div>
          <h2
            className="text-3xl font-bold uppercase text-[#E5E5E5] tracking-[0.15em] mb-8"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            TECHNICAL <span className="text-[#FF5F1F]">SPEC</span>
          </h2>
          <div className="border border-[#262626] max-w-2xl">
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
                className={`grid grid-cols-2 px-6 py-3.5 font-mono text-sm ${i % 2 === 0 ? "bg-[#0D0D0D]" : "bg-[#111111]"} border-b border-[#1a1a1a] last:border-b-0`}
              >
                <span className="text-[#404040] tracking-[0.15em] text-[11px] uppercase">{key}</span>
                <span className="text-[#E5E5E5] text-[12px]">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ INSTALL [0,1] ══ */}
        <div
          style={{ position: "absolute", left: 0, top: "100vh", width: "100vw", height: "100vh" }}
          className="flex flex-col justify-center px-6 lg:px-12 lg:pl-16 pt-20 pb-6 overflow-hidden"
        >
          <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-6">
            [35.6762° N, 139.6503° E] — DEPLOYMENT_SEQUENCE
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2
                className="text-3xl font-bold uppercase text-[#E5E5E5] tracking-[0.15em] mb-4"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                DEPLOY IN
                <br />
                <span className="text-[#FF5F1F]">30 SECONDS.</span>
              </h2>
              <p className="text-[#707070] text-sm font-mono leading-relaxed mb-6">
                No configuration required to start. SENTINEL ships with sane defaults.
                Tune it when you need to.
              </p>
              <div className="space-y-px">
                <InstallStep n="01" cmd="npm install -g @sentinel-cli/core" comment="// INSTALL_GLOBAL" />
                <InstallStep n="02" cmd="sentinel init" comment="// INITIALIZE_CONFIG" />
                <InstallStep n="03" cmd="sentinel watch --all" comment="// BEGIN_SURVEILLANCE" />
              </div>
            </div>
            {/* Terminal mockup */}
            <div className="border border-[#262626] bg-[#0D0D0D] hidden lg:block">
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
                  cpu=12% mem=244MB
                </div>
                <div className="text-[#E5E5E5]">
                  <span className="text-[#404040]">2025-03-12T14:22:02Z</span>{" "}
                  <span className="text-[#00FF41]">NOMINAL</span>{" "}
                  cpu=14% mem=245MB
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
          </div>
        </div>

        {/* ══ CTA [0,2] ══ */}
        <div
          style={{ position: "absolute", left: 0, top: "200vh", width: "100vw", height: "100vh" }}
          className="flex flex-col lg:pl-10 pt-16 pb-0 overflow-hidden"
        >
          <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 text-center">
            <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em] mb-8 self-start">
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
              Deploy SENTINEL in 30 seconds. No account. No telemetry. No noise. Just signal.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setCurrent(PATH.indexOf("install"))}
                className="chamfered bg-[#FF5F1F] text-black text-xs font-bold tracking-[0.25em] uppercase px-10 py-5 hover:bg-[#E5E5E5] transition-colors duration-50 cursor-crosshair"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                DEPLOY NOW — FREE
              </button>
              <a
                href="#"
                className="chamfered border-2 border-[#404040] text-[#E5E5E5] text-xs font-bold tracking-[0.25em] uppercase px-10 py-5 hover:border-[#FF5F1F] hover:text-[#FF5F1F] transition-colors duration-50 cursor-crosshair"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                READ THE DOCS
              </a>
            </div>
          </div>
          {/* Footer */}
          <footer className="border-t border-[#262626] px-6 lg:px-12 py-5 shrink-0">
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
                <span><LiveClock /></span>
              </div>
            </div>
          </footer>
        </div>

      </div>{/* end canvas */}

      {/* ── Mini-map HUD ── */}
      <div className="fixed bottom-6 right-6 z-50 border border-[#262626] p-3 bg-[#0D0D0D]/90 backdrop-blur-sm">
        <div className="text-[8px] text-[#404040] font-mono tracking-[0.2em] mb-2 uppercase">Grid_Nav</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 28px)",
            gridTemplateRows: "repeat(3, 20px)",
            gap: "3px",
          }}
        >
          {(Object.entries(GRID) as [SectionId, [number, number]][]).map(([id, [c, r]]) => (
            <button
              key={id}
              onClick={() => setCurrent(PATH.indexOf(id))}
              title={id.toUpperCase()}
              style={{ gridColumn: c + 1, gridRow: r + 1 }}
              className={`text-[7px] font-mono border transition-all duration-200 cursor-crosshair ${
                sectionId === id
                  ? "border-[#FF5F1F] bg-[#FF5F1F]/10 text-[#FF5F1F]"
                  : "border-[#262626] text-[#404040] hover:border-[#FF5F1F] hover:text-[#FF5F1F]"
              }`}
            >
              {id.slice(0, 2).toUpperCase()}
            </button>
          ))}
          {/* Empty cell at [1,2] */}
          <div style={{ gridColumn: 2, gridRow: 3, border: "1px solid #1a1a1a" }} />
        </div>
        {/* Path connector lines overlay (decorative) */}
        <div className="mt-2 pt-2 border-t border-[#1a1a1a]">
          <div className="text-[7px] text-[#262626] font-mono tracking-widest">
            {PATH.map((id, i) => (
              <span key={id}>
                <span style={{ color: sectionId === id ? "#FF5F1F" : "#262626" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i < PATH.length - 1 && <span className="mx-0.5">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section counter + direction hint ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5">
        <div className="text-[10px] text-[#404040] font-mono tracking-[0.2em]">
          {String(current + 1).padStart(2, "0")} / {String(PATH.length).padStart(2, "0")} — {SECTION_LABELS[sectionId]}
        </div>
        {nextId && (
          <div
            className="text-[#404040] text-xs font-mono"
            style={{ animation: "dirPulse 1.8s ease-in-out infinite" }}
          >
            {dirHint}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dirPulse {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(2px); }
        }
      `}</style>

    </div>
  );
}
