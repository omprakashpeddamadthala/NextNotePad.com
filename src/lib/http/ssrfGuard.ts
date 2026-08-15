/** Coarse literal-address blocklist for the HTTP Tools proxy — it's unauthenticated (so guest
 *  mode can use it too), so this keeps casual/accidental probing of the server's own local
 *  network out of reach. Not a full SSRF defense: a hostname that only resolves to a private IP
 *  via DNS (DNS-rebinding style) isn't caught here, since that needs resolving + pinning the
 *  connection to the checked IP, more than this scratch dev tool needs to guard against. */

function isPrivateOrLoopbackIPv4(host: string): boolean {
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return false;
  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true; // IPv6 link-local/ULA
  if (isPrivateOrLoopbackIPv4(host)) return true;
  return false;
}
