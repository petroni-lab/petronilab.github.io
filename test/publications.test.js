// Run: node test/publications.test.js
const assert = require("assert");
const { parseBib, cleanTex, formatAuthors, toBibtex, linksOf } = require("../assets/publications.js");

const bib = `
@comment{ ignored @article{nope, title={x}} }
@inproceedings{sigillo2026demo,
  title = {{KILT}: a Benchmark for {\\'E}lan -- \\& more},
  author = {Sigillo, Luigi and Fabio Petroni},
  year = 2026,
  booktitle = "EMNLP",
  eprint = {2609.01234},
  github = {https://github.com/x/y},
}
@article{b, title={Nested {braces {deep}}}, year={2025}}
`;
const entries = parseBib(bib);
assert.strictEqual(entries.length, 2);
const [a, b] = entries;
assert.strictEqual(a.key, "sigillo2026demo");
assert.strictEqual(a.fields.year, "2026");
assert.strictEqual(a.fields.booktitle, "EMNLP");
assert.strictEqual(cleanTex(a.fields.title), "KILT: a Benchmark for Élan – & more");
assert.strictEqual(formatAuthors(a.fields.author), "Luigi Sigillo, Fabio Petroni");
assert.strictEqual(cleanTex(b.fields.title), "Nested braces deep");
assert.deepStrictEqual(linksOf(a.fields).map(([l]) => l), ["arXiv", "Code"]);
assert.ok(!toBibtex(a).includes("github"));
assert.ok(toBibtex(a).startsWith("@inproceedings{sigillo2026demo,"));

const fs = require("fs");
parseBib(fs.readFileSync(__dirname + "/../publications.bib", "utf8")); // the real file must parse
console.log("ok");
