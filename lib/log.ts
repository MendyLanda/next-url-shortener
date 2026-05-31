// Minimal structured logger for server-side hot paths (auth, link CRUD, unlock).
// Lines go to stdout/stderr, so they show up in `docker logs` and the host's log
// viewer (Coolify, Dokploy, Railway, Render, Fly, …) without any extra setup.
//
// Format: `<iso-ts> [cut] <LEVEL> <event> key=value key=value`
// e.g.    2026-05-31T18:04:11.512Z [cut] INFO link.create slug=abc23x dest=github.com ip=1.2.3.4
//
// Values are intentionally low-cardinality and non-sensitive: slugs, hosts,
// outcomes, IPs — never passwords, tokens, or full destination URLs.

type Field = string | number | boolean | null | undefined;
type Fields = Record<string, Field>;

function format(level: string, event: string, fields?: Fields): string {
  let out = `${new Date().toISOString()} [cut] ${level} ${event}`;
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      // Quote strings that contain whitespace so each pair stays grep-friendly.
      const v =
        typeof value === "string" && /\s/.test(value) ? JSON.stringify(value) : value;
      out += ` ${key}=${v}`;
    }
  }
  return out;
}

export const log = {
  info: (event: string, fields?: Fields) => console.log(format("INFO", event, fields)),
  warn: (event: string, fields?: Fields) => console.warn(format("WARN", event, fields)),
  error: (event: string, fields?: Fields) =>
    console.error(format("ERROR", event, fields)),
};
