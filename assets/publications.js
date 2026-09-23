// Renders publications.bib on the home page (#publication-list) and on publication.html?id=<key>.
// ponytail: tiny BibTeX parser, no @string macros or # concatenation; swap in a library if the .bib ever needs them.

const SITE_ONLY_FIELDS = ["abstract", "tldr", "cover", "github", "code", "project", "website", "pdf", "video", "slides"];

function parseBib(text) {
  const entries = [];
  let i = 0;

  const skipSpace = () => {
    while (i < text.length && /[\s,]/.test(text[i])) i++;
  };
  const readBraced = () => {
    let depth = 0;
    const start = i + 1;
    for (; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}" && --depth === 0) return text.slice(start, i++);
    }
    throw new Error("Unbalanced braces in publications.bib");
  };

  while ((i = text.indexOf("@", i)) !== -1) {
    const open = text.indexOf("{", i);
    if (open === -1) break;
    const type = text.slice(i + 1, open).trim().toLowerCase();
    i = open;
    if (["comment", "string", "preamble"].includes(type)) {
      readBraced();
      continue;
    }
    const comma = text.indexOf(",", i);
    const key = text.slice(i + 1, comma).trim();
    i = comma + 1;
    const fields = {};
    for (;;) {
      skipSpace();
      if (i >= text.length || text[i] === "}") {
        i++;
        break;
      }
      const eq = text.indexOf("=", i);
      const name = text.slice(i, eq).trim().toLowerCase();
      i = eq + 1;
      while (/\s/.test(text[i])) i++;
      let value;
      if (text[i] === "{") {
        value = readBraced();
      } else if (text[i] === '"') {
        const end = text.indexOf('"', i + 1);
        value = text.slice(i + 1, end);
        i = end + 1;
      } else {
        const m = /^[^,}]*/.exec(text.slice(i))[0];
        value = m;
        i += m.length;
      }
      fields[name] = value.trim().replace(/\s+/g, " ");
    }
    entries.push({ type, key, fields });
  }
  return entries;
}

const ACCENTS = { "'": "́", "`": "̀", '"': "̈", "^": "̂", "~": "̃", c: "̧" };

function cleanTex(value = "") {
  return value
    .replace(/\\([`'"^~c])\s*\{?([a-zA-Z])\}?/g, (_, a, ch) => ch + ACCENTS[a])
    .replace(/\\([&%$#_])/g, "$1")
    .replace(/---/g, "—")
    .replace(/--/g, "–")
    .replace(/~/g, " ")
    .replace(/[{}]/g, "")
    .normalize("NFC");
}

function formatAuthors(author = "") {
  return author
    .split(/\s+and\s+/)
    .map((name) => {
      const [last, first] = cleanTex(name).split(/\s*,\s*/);
      return first ? `${first} ${last}` : last;
    })
    .join(", ");
}

function venueOf(f) {
  return cleanTex(f.journal || f.booktitle || f.publisher || f.howpublished || (f.eprint ? "arXiv preprint" : ""));
}

function linksOf(f) {
  const arxiv = f.eprint || f.arxiv;
  const arxivUrl = arxiv && `https://arxiv.org/abs/${arxiv}`;
  const paper = f.pdf || f.url || (f.doi && `https://doi.org/${f.doi}`);
  return [
    ["Paper", paper !== arxivUrl && paper],
    ["arXiv", arxivUrl],
    ["Code", f.github || f.code],
    ["Project", f.project || f.website],
    ["Video", f.video],
    ["Slides", f.slides],
  ].filter(([, href]) => href);
}

function toBibtex({ type, key, fields }) {
  const body = Object.entries(fields)
    .filter(([name]) => !SITE_ONLY_FIELDS.includes(name))
    .map(([name, value]) => `  ${name} = {${value}}`)
    .join(",\n");
  return `@${type}{${key},\n${body}\n}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function linksHtml(f) {
  return linksOf(f)
    .map(([label, href]) => `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}</a>`)
    .join("");
}

async function loadPublications() {
  const res = await fetch("publications.bib", { cache: "no-cache" });
  const entries = parseBib(await res.text());
  // Newest first; entries from the same year keep their order in the .bib file.
  return entries.sort((a, b) => (parseInt(b.fields.year, 10) || 0) - (parseInt(a.fields.year, 10) || 0));
}

async function renderList(list) {
  const entries = await loadPublications();
  if (!entries.length) {
    list.outerHTML = '<p class="pub-empty">Publications coming soon.</p>';
    return;
  }
  list.innerHTML = entries
    .map(({ key, fields: f }) => `
      <li class="pub-item">
        <span class="media-source">${escapeHtml([venueOf(f), f.year].filter(Boolean).join(", "))}</span>
        <a class="pub-title" href="publication.html?id=${encodeURIComponent(key)}">${escapeHtml(cleanTex(f.title))}</a>
        <p class="pub-authors">${escapeHtml(formatAuthors(f.author))}</p>
        <div class="pub-links">${linksHtml(f)}</div>
      </li>`)
    .join("");
}

async function renderPage(article) {
  const id = new URLSearchParams(location.search).get("id");
  const entry = (await loadPublications()).find((e) => e.key === id);
  if (!entry) {
    article.innerHTML = '<h1>Publication not found</h1><p><a href="index.html#publications">Back to publications</a></p>';
    return;
  }
  const f = entry.fields;
  const title = cleanTex(f.title);
  document.title = `${title} | Petroni Lab`;

  // Optional blog post: posts/<key>/index.md, with its images and files next to it.
  const dir = `posts/${encodeURIComponent(entry.key)}/`;
  const local = (path) => (/^([a-z]+:|\/|#)/i.test(path) ? path : dir + path);
  let post = "";
  const res = await fetch(`${dir}index.md`, { cache: "no-cache" });
  if (res.ok && window.marked) {
    // Hide math from marked so `_` and `*` inside $...$ survive, then put it back for KaTeX.
    const math = [];
    const md = (await res.text()).replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, (m) => `MATH${math.push(m) - 1}X`);
    post = window.marked.parse(md).replace(/MATH(\d+)X/g, (_, n) => escapeHtml(math[n]));
  }

  const date = [f.month && cleanTex(f.month), f.year].filter(Boolean).join(" ");
  article.innerHTML = `
    ${f.cover ? `<img class="pub-cover" src="${escapeHtml(local(f.cover))}" alt="">` : ""}
    <span class="eyebrow">${escapeHtml(venueOf(f))}</span>
    <h1 class="pub-page-title">${escapeHtml(title)}</h1>
    ${f.tldr ? `<p class="pub-tldr">${escapeHtml(cleanTex(f.tldr))}</p>` : ""}
    <p class="pub-authors">${escapeHtml([date, formatAuthors(f.author)].filter(Boolean).join(" \u00b7 "))}</p>
    <div class="pub-links">${linksHtml(f)}</div>
    ${post ? `<div class="post">${post}</div>` : f.abstract ? `<div class="post"><h2>Abstract</h2><p>${escapeHtml(cleanTex(f.abstract))}</p></div>` : ""}
    <h2>Cite</h2>
    <div class="bibtex">
      <button class="theme-toggle" type="button" data-copy>Copy BibTeX</button>
      <pre><code>${escapeHtml(toBibtex(entry))}</code></pre>
    </div>`;

  // Relative paths in the post point inside its folder.
  article.querySelectorAll(".post [src], .post [href], .post [poster]").forEach((el) => {
    for (const attr of ["src", "href", "poster"]) {
      if (el.hasAttribute(attr)) el.setAttribute(attr, local(el.getAttribute(attr)));
    }
  });

  article.querySelector("[data-copy]").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(toBibtex(entry));
    event.target.textContent = "Copied";
  });

  // $...$ and $$...$$ math in posts
  if (window.renderMathInElement) {
    window.renderMathInElement(article, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
    });
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("publication-list");
    const article = document.getElementById("publication");
    const fail = (el) => (error) => {
      console.error(error);
      el.innerHTML = "<p>Could not load publications.</p>";
    };
    if (list) renderList(list).catch(fail(list));
    if (article) renderPage(article).catch(fail(article));
  });
}

if (typeof module !== "undefined") module.exports = { parseBib, cleanTex, formatAuthors, toBibtex, linksOf };
