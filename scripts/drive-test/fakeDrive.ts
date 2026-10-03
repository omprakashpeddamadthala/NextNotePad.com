/* In-memory stand-in for the subset of drive_v3.Drive that DriveService uses. Test-only. */
type F = {
  id: string;
  name: string;
  mimeType: string;
  parents: string[];
  appProperties: Record<string, string>;
  description?: string | null;
  content: string;
  createdTime: string;
  modifiedTime: string;
  version: number;
  trashed: boolean;
};

export function createFakeDrive() {
  const files = new Map<string, F>();
  let seq = 0;
  const calls: Record<string, number> = {
    list: 0,
    get: 0,
    create: 0,
    update: 0,
  };
  const now = () => new Date(Date.now() + seq).toISOString();

  function matches(f: F, q: string): boolean {
    // supports: clauses joined by " and "; one optional parenthesised "or" group of "'x' in parents"
    const orGroup = q.match(/^\((.*?)\) and (.*)$/);
    let rest = q;
    if (orGroup) {
      const ids = [...orGroup[1].matchAll(/'([^']+)' in parents/g)].map(
        (m) => m[1],
      );
      if (!ids.some((id) => f.parents.includes(id))) return false;
      rest = orGroup[2];
    }
    for (const clause of rest.split(" and ")) {
      let m;
      if ((m = clause.match(/^name = '((?:[^'\\]|\\.)*)'$/))) {
        if (f.name !== m[1].replace(/\\(.)/g, "$1")) return false;
      } else if ((m = clause.match(/^'([^']+)' in parents$/))) {
        if (!f.parents.includes(m[1])) return false;
      } else if ((m = clause.match(/^trashed = (true|false)$/))) {
        if (isTrashed(f) !== (m[1] === "true")) return false;
      } else if ((m = clause.match(/^mimeType = '([^']+)'$/))) {
        if (f.mimeType !== m[1]) return false;
      } else if ((m = clause.match(/^mimeType != '([^']+)'$/))) {
        if (f.mimeType === m[1]) return false;
      } else throw new Error(`fake drive: unsupported clause ${clause}`);
    }
    return true;
  }
  function isTrashed(f: F): boolean {
    if (f.trashed) return true;
    return f.parents.some((p) => {
      const parent = files.get(p);
      return parent ? isTrashed(parent) : false;
    });
  }
  function out(f: F) {
    const { content, ...meta } = f;
    return {
      ...meta,
      size: String(Buffer.byteLength(content)),
      version: String(f.version),
      trashed: isTrashed(f),
    };
  }
  function notFound(): never {
    const e = new Error("File not found") as Error & { code: number };
    e.code = 404;
    throw e;
  }

  const drive = {
    files: {
      async list(p: { q: string; pageSize?: number; pageToken?: string }) {
        calls.list++;
        const all = [...files.values()].filter((f) => matches(f, p.q));
        const start = Number(p.pageToken ?? 0);
        const size = p.pageSize ?? 100;
        const page = all.slice(start, start + size);
        return {
          data: {
            files: page.map(out),
            nextPageToken:
              start + size < all.length ? String(start + size) : undefined,
          },
        };
      },
      async get(p: { fileId: string; alt?: string }) {
        calls.get++;
        const f = files.get(p.fileId) ?? notFound();
        return { data: p.alt === "media" ? f.content : out(f) };
      },
      async create(p: { requestBody: Partial<F>; media?: { body: string } }) {
        calls.create++;
        const id = `d${++seq}`;
        const t = now();
        const f: F = {
          id,
          name: p.requestBody.name!,
          mimeType: p.requestBody.mimeType ?? "text/plain",
          parents: p.requestBody.parents ?? ["root"],
          appProperties: { ...(p.requestBody.appProperties ?? {}) },
          description: p.requestBody.description ?? null,
          content: p.media?.body ?? "",
          createdTime: t,
          modifiedTime: t,
          version: 1,
          trashed: false,
        };
        files.set(id, f);
        return { data: out(f) };
      },
      async update(p: {
        fileId: string;
        addParents?: string;
        removeParents?: string;
        requestBody?: Partial<F> & { trashed?: boolean };
        media?: { body: string };
      }) {
        calls.update++;
        const f = files.get(p.fileId) ?? notFound();
        const b = p.requestBody ?? {};
        if (b.name !== undefined) f.name = b.name;
        if (b.description !== undefined) f.description = b.description;
        if (b.trashed !== undefined) f.trashed = b.trashed;
        if (b.appProperties)
          for (const [k, v] of Object.entries(b.appProperties)) {
            if (v === null) delete f.appProperties[k];
            else f.appProperties[k] = v;
          }
        if (p.removeParents)
          f.parents = f.parents.filter(
            (x) => !p.removeParents!.split(",").includes(x),
          );
        if (p.addParents) f.parents.push(...p.addParents.split(","));
        if (p.media) f.content = p.media.body;
        f.version++;
        f.modifiedTime = now();
        seq++;
        return { data: out(f) };
      },
    },
  };
  return { drive, files, calls };
}
