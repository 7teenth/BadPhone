#!/usr/bin/env node

/**
 * GitHub Release automation script
 * - Берёт версию из последнего git-тега
 * - Создаёт релиз
 * - Загружает артефакты
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/* ================== CONFIG ================== */

const CONFIG = {
  owner: "7teenth",
  repo: "BadPhone",
  token: process.env.GITHUB_TOKEN,
};

/* ================== ARGS ================== */

const args = process.argv.slice(2);

let isDraft = false;
let prerelease = false;
let artifacts = [];
let releaseNotes = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--draft") isDraft = true;
  else if (arg === "--prerelease") prerelease = true;
  else if ((arg === "--artifact" || arg === "-a") && args[i + 1]) {
    artifacts.push(args[++i]);
  } else if ((arg === "--notes" || arg === "-n") && args[i + 1]) {
    releaseNotes = args[++i];
  }
}

/* ================== VALIDATION ================== */

if (!CONFIG.token) {
  console.error("❌ GITHUB_TOKEN не задан");
  process.exit(1);
}

artifacts.forEach((file) => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Артефакт не найден: ${file}`);
    process.exit(1);
  }
});

/* ================== GIT VERSION ================== */

function getLastGitTag() {
  try {
    return execSync("git describe --tags --abbrev=0")
      .toString()
      .trim();
  } catch {
    console.error("❌ Не удалось получить git-тег");
    console.error("👉 Убедись, что:");
    console.error("   - есть теги");
    console.error("   - git fetch --tags выполнен");
    process.exit(1);
  }
}

const tag = getLastGitTag();
const version = tag.replace(/^v/, "");

/* ================== HTTP ================== */

function request(method, path, data, upload = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      method,
      path,
      headers: {
        Authorization: `Bearer ${CONFIG.token}`,
        "User-Agent": "release-script",
        Accept: "application/vnd.github+json",
      },
    };

    if (upload) {
      options.headers["Content-Type"] = "application/octet-stream";
      options.headers["Content-Length"] = data.length;
    } else if (data) {
      const json = JSON.stringify(data);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(json);
    }

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`${res.statusCode}: ${body}`));
        } else {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(upload ? data : JSON.stringify(data));
    req.end();
  });
}

/* ================== NOTES ================== */

function generateNotes() {
  return `# BadPhone ${tag}

🗓 ${new Date().toISOString().slice(0, 10)}

## Changes
- Improvements and fixes

---
`;
}

/* ================== MAIN ================== */

async function run() {
  console.log("🚀 GitHub Release");
  console.log("🔖 Tag:", tag);
  console.log("📦 Repo:", `${CONFIG.owner}/${CONFIG.repo}`);

  const release = await request(
    "POST",
    `/repos/${CONFIG.owner}/${CONFIG.repo}/releases`,
    {
      tag_name: tag,
      name: tag,
      body: releaseNotes || generateNotes(),
      draft: isDraft,
      prerelease,
    }
  );

  console.log("✅ Release created:", release.html_url);

  for (const file of artifacts) {
    const name = path.basename(file);
    const data = fs.readFileSync(file);

    console.log("⬆ Upload:", name);

    await request(
      "POST",
      `/repos/${CONFIG.owner}/${CONFIG.repo}/releases/${release.id}/assets?name=${encodeURIComponent(
        name
      )}`,
      data,
      true
    );

    console.log("✔ Uploaded:", name);
  }

  console.log("🎉 Done");
}

run().catch((e) => {
  console.error("❌ Failed:", e.message);
  process.exit(1);
});
