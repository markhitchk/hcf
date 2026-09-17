import { readFileSync, readdirSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssRoot = resolve(repositoryRoot, "v1.x");
const findings = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitDeclarations(body) {
  const parts = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  let parenDepth = 0;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") parenDepth += 1;
    else if (char === ")" && parenDepth > 0) parenDepth -= 1;
    else if (char === ";" && parenDepth === 0) {
      parts.push(body.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(body.slice(start));
  return parts;
}

function splitPropertyValue(declaration) {
  let quote = null;
  let escaped = false;
  let parenDepth = 0;

  for (let index = 0; index < declaration.length; index += 1) {
    const char = declaration[index];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") parenDepth += 1;
    else if (char === ")" && parenDepth > 0) parenDepth -= 1;
    else if (char === ":" && parenDepth === 0) {
      return [declaration.slice(0, index), declaration.slice(index + 1)];
    }
  }

  return null;
}

for (const file of walk(cssRoot).sort()) {
  const source = stripComments(readFileSync(file, "utf8"));
  const leafRule = /([^{}]+)\{([^{}]*)\}/g;

  for (const match of source.matchAll(leafRule)) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    const seen = new Set();

    for (const rawDeclaration of splitDeclarations(match[2])) {
      const declaration = rawDeclaration.trim();
      if (!declaration) continue;

      const pair = splitPropertyValue(declaration);
      if (!pair) continue;

      let property = pair[0].trim();
      const value = pair[1].trim();
      if (!property || !value) continue;
      if (!property.startsWith("--")) property = property.toLowerCase();

      const normalized = `${property}:${value}`;
      if (seen.has(normalized)) {
        findings.push(`${relative(repositoryRoot, file)} :: ${selector} :: ${normalized}`);
      } else {
        seen.add(normalized);
      }
    }
  }
}

if (findings.length) {
  findings.sort();
  console.error(`Found ${findings.length} exact duplicate CSS declaration(s):`);
  for (const finding of findings) console.error(finding);
  process.exit(1);
}

console.log("No exact duplicate CSS declarations found in v1.x.");
