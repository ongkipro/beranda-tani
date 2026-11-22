import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

/**
 * The storefront image contract (DESIGN-SYSTEM.md "Contract"): a public `<img>`
 * says whether it is the page's first paint or can wait (`loading="eager"` for
 * the likely LCP image and the header brand, `"lazy"` for everything else), and
 * reserves its box with `width` and `height` so nothing shifts when it arrives.
 * `loading` left off means eager, which on a below-the-fold photo costs an ad
 * landing real bytes and on a forgotten one nobody can tell intent from
 * oversight. CMS landing HTML is covered separately by `deferOffscreenImages`.
 *
 * Every `<img` in the raw file is scanned, each on its own, so a tag in markup,
 * frontmatter JSX, a `{…}` expression, `set:html` or a script string is read, and
 * odd text before a tag cannot hide it. A tag is skipped only when it starts in a
 * comment the TypeScript parser reports: anywhere in a `.ts` file, and in `.astro`
 * frontmatter when the TS and TSX parses agree. Everything else is scanned, so a
 * mistake can fail a commented-out tag but never hide a real one.
 *
 * lazy: a commented-out `<img` in `.astro` markup or a `<script>` is still read and
 * must be removed rather than commented (no file has one). Telling markup from
 * script without a full Astro parse is where three earlier drafts failed open.
 * Upgrade path: the AST of the compiler the build itself uses, once it is a declared
 * dependency this test can import.
 *
 * Fix the tag, not this test. An exception below needs a reason a reviewer can
 * check against the file, and an exception that no longer matches a tag fails
 * the suite so the list cannot outlive the code it excuses.
 */
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

// /hello (the admin login) and AdminLayout are the admin surface (DESIGN-SYSTEM §0.2), not this contract.
const ADMIN = new Set(["src/pages/hello.astro", "src/layouts/AdminLayout.astro"]);
const all = [
  ...walk("src/components/storefront"),
  ...walk("src/layouts"),
  ...walk("src/scripts"),
  ...walk("src/pages").filter((f) => !f.startsWith("src/pages/admin/") && !f.startsWith("src/pages/api/")),
].filter((f) => !ADMIN.has(f) && !f.endsWith(".test.ts"));
const files = all.filter((f) => f.endsWith(".astro") || f.endsWith(".ts"));
/** A file type the scan cannot read (`.tsx`, `.mdx`, `.js` …) would be a public image it never sees. */
const unread = all.filter((f) => !files.includes(f) && !f.endsWith(".md") && !f.endsWith(".json"));

type Range = [start: number, end: number];

/** Comment ranges the TypeScript parser reports in `code`, offset by `base`. */
function commentRanges(code: string, kind = ts.ScriptKind.TS, base = 0): Range[] {
  const source = ts.createSourceFile(kind === ts.ScriptKind.TSX ? "x.tsx" : "x.ts", code, ts.ScriptTarget.Latest, false, kind);
  // JSX text is prose, not trivia: `<p>// see <img …></p>` has no comment in it. Every
  // JSX text span is known before any comment is read, so visiting order cannot matter.
  const jsxText: Range[] = [];
  const collect = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.JsxText) jsxText.push([node.pos, node.end]);
    ts.forEachChild(node, collect);
  };
  collect(source);
  const found = new Map<number, Range>();
  const read = (ranges: ts.CommentRange[] | undefined) => {
    for (const r of ranges ?? []) {
      if (!jsxText.some(([start, end]) => r.pos < end && r.end > start)) found.set(r.pos, [base + r.pos, base + r.end]);
    }
  };
  const visit = (node: ts.Node) => {
    read(ts.getLeadingCommentRanges(code, node.getFullStart()));
    read(ts.getTrailingCommentRanges(code, node.end));
    node.getChildren(source).forEach(visit);
  };
  visit(source);
  return [...found.values()];
}

/** Ranges of `source` that are certainly comments: a `.ts` file's, or what both TS and TSX call one in frontmatter. */
function comments(file: string, source: string): Range[] {
  if (file.endsWith(".ts")) return commentRanges(source);
  // The frontmatter is always the file's first lines, so even a fence found too early is a span of real code.
  const fence = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!fence) return [];
  const base = fence[0].indexOf("\n") + 1;
  const tsx = new Set(commentRanges(fence[1], ts.ScriptKind.TSX, base).map(String));
  return commentRanges(fence[1], ts.ScriptKind.TS, base).filter((r) => tsx.has(String(r)));
}

const inside = (ranges: Range[], at: number) => ranges.some(([start, end]) => at >= start && at < end);

/**
 * Every `<img …>` in `code` that does not start inside `skip`, read to its real end. A
 * `>` inside `{…}` or inside a quoted value is not the end, and a quote opened inside
 * `{…}` is honoured too. A tag that never closes throws: a guard that silently drops
 * what it cannot read fails open.
 */
function imgTags(code: string, skip: Range[] = []): { tag: string; index: number }[] {
  const tags: { tag: string; index: number }[] = [];
  for (const start of code.matchAll(/<img\s/gi)) {
    if (inside(skip, start.index)) continue;
    let depth = 0;
    let quote = "";
    let end = -1;
    for (let i = start.index; i < code.length && end < 0; i++) {
      const ch = code[i];
      if (quote) {
        if (ch === quote) quote = "";
      } else if (ch === '"' || ch === "'" || ch === "`") {
        quote = ch;
      } else if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
      } else if (ch === ">" && depth === 0) {
        end = i;
      }
    }
    if (end < 0) throw new Error(`unterminated <img at offset ${start.index}`);
    tags.push({ tag: code.slice(start.index, end + 1), index: start.index });
  }
  return tags;
}

/** The tag with every quoted value blanked, so only attribute names remain readable. */
const blankQuotes = (tag: string) => tag.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, (q) => " ".repeat(q.length));

/** A real attribute name: not `data-loading=`, not `max-width=`, and not text inside a value. */
const hasAttr = (tag: string, name: string) => new RegExp(`(?<![\\w-])${name}\\s*=`).test(blankQuotes(tag));

/**
 * `loading` that always renders: a literal `lazy`/`eager`, or a ternary whose both
 * branches are one. `{props.loading}` or `{x ? "eager" : undefined}` renders no
 * attribute when the value is undefined, which is the oversight this guard catches.
 */
function declaresLoading(tag: string): boolean {
  const at = blankQuotes(tag).search(/(?<![\w-])loading\s*=/);
  if (at < 0) return false;
  const value = tag.slice(at).replace(/^loading\s*=\s*/, "");
  const literal = value.match(/^(["'`])([^"'`]*)\1/);
  if (literal) return /^(lazy|eager)$/.test(literal[2]);
  const expr = value.match(/^\$?\{([^}]*)\}/)?.[1] ?? "";
  const one = /^\s*(["'`])(lazy|eager)\1\s*$/;
  const ternary = /^[^?]+\?\s*(["'`])(lazy|eager)\1\s*:\s*(["'`])(lazy|eager)\3\s*$/;
  return one.test(expr) || ternary.test(expr);
}

type Skip = "loading" | "dimensions";
/** `tags` is how many tags the exception covers (default 1), checked exactly. */
const EXCEPTIONS: { file: string; contains: string; skip: Skip[]; why: string; tags?: number }[] = [
  {
    file: "src/components/storefront/tracking/MetaPixelBase.astro",
    contains: "facebook.com/tr",
    skip: ["loading"],
    why: "1x1 pixel inside <noscript>; no layout, and a lazy beacon might never fire",
  },
  // beranda-tani: no SiteBrand `src={uploadedLogo}` exception. Its SiteBrand.astro is
  // install-themed (Petani Sejahtera) with a fixed 34x34 logo, so the product's entry
  // would excuse nothing. Expect a conflict here on a product edit; keep this side.
  {
    file: "src/components/storefront/forms/FormHybridContent.astro",
    contains: "src={bannerImage}",
    skip: ["dimensions"],
    why: "merchant promo banner, unknown intrinsic size; h-auto w-full, lazy, below the form",
  },
  {
    file: "src/components/storefront/forms/FormMiddleContent.astro",
    contains: "src={bannerImage}",
    skip: ["dimensions"],
    why: "merchant promo banner, unknown intrinsic size; h-auto w-full, lazy, below the form",
  },
  {
    file: "src/pages/[slug].astro",
    contains: "src={config.src}",
    skip: ["dimensions"],
    why: "a CMS image section stores only src and alt, so there is no size to declare; eager first, lazy after",
    tags: 2,
  },
  {
    file: "src/pages/payment.astro",
    contains: 'id="qr-image"',
    skip: ["loading", "dimensions"],
    why: "hidden until script sets a generated QR, inside a fixed-size box",
  },
  {
    file: "src/pages/thanks.astro",
    contains: 'id="payment-qr-image"',
    skip: ["loading", "dimensions"],
    why: "hidden until script sets a generated QR, inside a fixed-size box",
  },
];

test("every public <img> declares loading and reserves its box", () => {
  const used = new Set<number>();
  const matches = EXCEPTIONS.map(() => 0);
  const failures: string[] = unread.map((f) => `${f} is a file type this scan cannot read`);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const skip = comments(file, source);
    const lineOf = (index: number) => source.slice(0, index).split("\n").length;
    // A DOM-built image never appears as `<img` text, so it would ship unchecked.
    for (const m of source.matchAll(/createElement\(\s*["'`]img["'`]\s*\)|new Image\(/gi)) {
      if (!inside(skip, m.index)) failures.push(`${file}:${lineOf(m.index)} builds an image through the DOM; write the tag as markup or a string this scan reads`);
    }
    for (const { tag, index } of imgTags(source, skip)) {
      const missing: Skip[] = [];
      const names: string[] = [];
      if (!declaresLoading(tag)) (missing.push("loading"), names.push("loading"));
      if (!hasAttr(tag, "width")) (missing.push("dimensions"), names.push("width"));
      if (!hasAttr(tag, "height")) (missing.push("dimensions"), names.push("height"));
      const hit = EXCEPTIONS.findIndex((e) => e.file === file && tag.includes(e.contains));
      if (hit >= 0) matches[hit]++;
      const excused = hit >= 0 ? EXCEPTIONS[hit].skip : [];
      // An exception counts as used only when it actually excused something.
      if (hit >= 0 && missing.some((m) => excused.includes(m))) used.add(hit);
      const unexcused = names.filter((_, i) => !excused.includes(missing[i]));
      if (unexcused.length) failures.push(`${file}:${lineOf(index)} is missing ${unexcused.join(", ")}`);
    }
  }
  // An exception excuses the tags it names. Another tag that happens to share
  // its src expression is new code nobody reviewed against the reason.
  EXCEPTIONS.forEach((e, i) => {
    const want = e.tags ?? 1;
    if (matches[i] > want) failures.push(`${e.file} ~ ${e.contains} matches ${matches[i]} tags; the exception covers ${want}`);
  });
  assert.deepEqual(failures, []);
  // Stale means the tag is still there and no longer needs the excuse. A tag
  // that is gone entirely is an install that replaced the product file with
  // its own (numaskin's and beranda-tani's text SiteBrand): deleting the entry
  // there turned every product merge into a conflict on this file.
  const stale = EXCEPTIONS.filter((_, i) => matches[i] > 0 && !used.has(i)).map((e) => `${e.file} ~ ${e.contains}`);
  assert.deepEqual(stale, [], "an exception that excuses nothing must be deleted");
});

test("the walk reaches the public surface and nothing else", () => {
  assert.ok(files.some((f) => f.endsWith("form-hybrid.ts")), "the walk must reach the scripts that build <img> strings");
  assert.ok(!files.includes("src/layouts/AdminLayout.astro"), "the admin layout is not the public surface");
  assert.ok(files.length > 20, "the walk must actually find the storefront files");
});

/** The `src` of every tag the scan reads in an `.astro` source. */
const astroSrcs = (source: string) =>
  imgTags(source, comments("x.astro", source)).map(({ tag }) => tag.match(/src=(\{[^}]*\}|"[^"]*")/)?.[1]);

test("an .astro file is read everywhere a tag can live, and only frontmatter comments are skipped", () => {
  assert.deepEqual(
    astroSrcs(`---
// an <img that won't close, in a comment
const card = <p>see http://a <img src={x} /></p>;
const html = '<img src="a" loading="lazy" width="1" height="1">';
---
<p>Don't stop: {ok && '<img src="expr">'}</p>
<div set:html={'<IMG src="sethtml">'} />
<script>const t = \`<img src="\${u}" loading="eager">\`;</script>`),
    ["{x}", '"a"', '"expr"', '"sethtml"', '"${u}"'],
  );
});

test("nothing that only looks like a comment can hide a real tag", () => {
  // Each of these hid the real tag in an earlier draft that guessed at markup and script regions.
  const cases: [string, string[]][] = [
    ['{/* note */ cond}\n<img src="x">\n{/* other */}', ['"x"']],
    ['<script>const a = "<!--";</script>\n<img src="y">\n<!-- c -->', ['"y"']],
    ['<script type="application/ld+json" is:inline set:html={json} />\n<p>http://q <img src="z"></p>\n</div><script>x()</script>', ['"z"']],
    ['<!-- <script> old -->\n<p>see http://cdn <img src="v"></p>\n<script>y()</script>', ['"v"']],
    ['---\nconst t = `\n---\nconst m = "<!--";`;\n---\n<img src="u">\n<!-- c -->', ['"u"']],
    ['---\nconst a = <any>foo; // <img src="doubt">\n---\n<img src="w">', ['"doubt"', '"w"']],
    ['---\nconst card = <p>// see <img src={jsx} /></p>;\n---\n', ['{jsx}']],
    ['---\r\n-\r\n---\r\n<img src="crlf">', ['"crlf"']],
  ];
  for (const [source, srcs] of cases) assert.deepEqual(astroSrcs(source), srcs, source);
});

test("a tag is read to its real end", () => {
  const tags = imgTags('<img alt={`a > b`} src="x>y" loading="lazy" /> <img\n width="1"\n/> <img alt={c ? "}" : ""} src="a" />');
  assert.equal(tags.length, 3);
  assert.ok(hasAttr(tags[1].tag, "width"), "a tag split over lines is read whole");
  assert.ok(hasAttr(tags[2].tag, "src") && !hasAttr(tags[2].tag, "loading"), "a `}` in a string must not end the expression early");
});

test("code strings are scanned to their real end, comments ignored", () => {
  const source = `// <img in a comment won't close
const a = \`<img alt={\\\`a > b\\\`} src="x>y" loading="lazy" />\`;
/* <img src="gone"> */
const b = '<IMG src="u" data-loading="x" max-width="1" alt="width = 3">';`;
  const tags = imgTags(source, comments("x.ts", source)).map(({ tag }) => tag);
  assert.equal(tags.length, 2);
  assert.ok(declaresLoading(tags[0]) && tags[0].endsWith("/>"), "a `>` in a value must not end the tag");
  assert.deepEqual([declaresLoading(tags[1]), hasAttr(tags[1], "width"), hasAttr(tags[1], "height")], [false, false, false], "look-alike attributes do not count");
  assert.throws(() => imgTags('<img src="a" loading="lazy"'), /unterminated/);
});

test("loading counts only when it always renders", () => {
  for (const ok of ['loading="lazy"', "loading='eager'", "loading={i === 0 ? 'eager' : 'lazy'}", 'loading={"lazy"}']) {
    assert.ok(declaresLoading(`<img src="a" ${ok} />`), ok);
  }
  for (const bad of ["loading={props.loading}", "loading={eager ? 'eager' : undefined}", 'loading="auto"', "loading={x ?? 'lazy'}", 'alt="loading=lazy"']) {
    assert.ok(!declaresLoading(`<img src="a" ${bad} />`), bad);
  }
});

/** CSS with every `@layer … { … }` block removed, braces matched, comments dropped. */
function unlayered(css: string): string {
  let out = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (let at = out.search(/@layer\b[^;{]*\{/); at >= 0; at = out.search(/@layer\b[^;{]*\{/)) {
    let depth = 0;
    let end = out.indexOf("{", at);
    for (; end < out.length; end++) {
      if (out[end] === "{") depth++;
      else if (out[end] === "}" && --depth === 0) break;
    }
    out = out.slice(0, at) + out.slice(end + 1);
  }
  return out;
}

/**
 * Every selector in `css` that styles a media element page-wide: `img`, `:where(img, video)`,
 * `img[width]`. A selector scoped by a class or an ancestor (`.payment-brand-mark img`) is
 * a component's own business and is left alone.
 */
const pageWideMedia = (css: string) =>
  [...css.matchAll(/([^{}]+)\{/g)]
    .flatMap((m) => m[1].replace(/:(?:where|is)\(([^()]*)\)/g, "$1").split(","))
    .map((sel) => sel.trim())
    .filter((sel) => /^(img|video|iframe)(\[[^\]]*\]|:[\w-]+(\([^)]*\))?)*$/i.test(sel));

/** The stylesheets a public page loads: the shared CSS and every public component's `<style>`. */
const publicStyles = (): [string, string][] => [
  ...walk("src/styles")
    .filter((f) => f.endsWith(".css") && f !== "src/styles/admin.css")
    .map((f): [string, string] => [f, readFileSync(f, "utf8")]),
  ...files
    .filter((f) => f.endsWith(".astro"))
    .map((f): [string, string] => [f, [...readFileSync(f, "utf8").matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n")]),
];

test("page-wide media rules sit in a cascade layer, so a Tailwind size class still wins", () => {
  // An unlayered rule beats every layered one whatever its specificity: an
  // unlayered `:where(img, video) { height: auto }` in BaseLayout once overrode
  // `h-full` on every public image and pushed the QRIS logo 5px out of its box.
  const styles = publicStyles();
  assert.ok(styles.some(([f]) => f === "src/layouts/BaseLayout.astro") && styles.some(([f]) => f.endsWith("form-hybrid.css")));
  const base = styles.find(([f]) => f === "src/layouts/BaseLayout.astro")![1];
  assert.match(base, /@layer base\s*\{[\s\S]*aspect-ratio: attr\(width/, "the attribute aspect ratio is in @layer base");
  const offenders = styles.flatMap(([f, css]) => pageWideMedia(unlayered(css)).map((sel) => `${f}: ${sel}`));
  assert.deepEqual(offenders, [], "no unlayered rule may style a media element page-wide");
  for (const bad of ["@layer base { iframe { max-width: 100% } }\n:where(img, video) { height: auto; }", "img, video { height: auto }", "img[width] { height: auto }"]) {
    assert.notDeepEqual(pageWideMedia(unlayered(bad)), [], bad);
  }
  for (const fine of ["@layer base { img { height: auto } }", ".payment-brand-mark img { height: 100% }", ".lp-section img, .lp-section video { height: auto }"]) {
    assert.deepEqual(pageWideMedia(unlayered(fine)), [], fine);
  }
});
