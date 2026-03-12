# SENTINEL

Real-time process and server health monitor. Watch your stack. Know when it dies.

## Structure

```
sentinel/       # Landing page (Next.js + Tailwind v4)
sentinel-cli/   # CLI tool (Node.js + TypeScript)
```

## CLI

```bash
npm install -g sentinel-cli

sentinel watch nginx
sentinel watch nginx postgres node   # multi-process dashboard
sentinel init                        # generate config file
```

See [sentinel-cli/README.md](sentinel-cli/README.md) for full documentation.

## Landing Page

```bash
cd sentinel
npm install
npm run dev
```

## License

MIT
