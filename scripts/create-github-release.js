#!/usr/bin/env node

/**
 * Скрипт для автоматизации создания релизов на GitHub
 * Использует GitHub REST API для создания релиза и загрузки артефактов
 * 
 * Использование:
 *   node scripts/create-github-release.js --version 1.0.7 --draft false
 *   node scripts/create-github-release.js -v 1.0.7 -a path/to/artifact.exe
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Конфигурация
const CONFIG = {
  owner: "7teenth",
  repo: "BadPhone",
  token: process.env.GITHUB_TOKEN,
};

// Парсинг аргументов командной строки
const args = process.argv.slice(2);
let version = null;
let isDraft = true;
let artifacts = [];
let releaseNotes = null;
let prerelease = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if ((arg === "--version" || arg === "-v") && i + 1 < args.length) {
    version = args[++i];
  } else if ((arg === "--draft" || arg === "-d") && i + 1 < args.length) {
    isDraft = args[++i].toLowerCase() !== "false";
  } else if ((arg === "--artifact" || arg === "-a") && i + 1 < args.length) {
    artifacts.push(args[++i]);
  } else if ((arg === "--notes" || arg === "-n") && i + 1 < args.length) {
    releaseNotes = args[++i];
  } else if ((arg === "--prerelease" || arg === "-p") && i + 1 < args.length) {
    prerelease = args[++i].toLowerCase() === "true";
  }
}

// Валидация
if (!version) {
  console.error("❌ Ошибка: необходимо указать версию (--version или -v)");
  process.exit(1);
}

if (!CONFIG.token) {
  console.error(
    "❌ Ошибка: переменная окружения GITHUB_TOKEN не установлена"
  );
  console.error(
    "   Установите: set GITHUB_TOKEN=your_token (Windows) или export GITHUB_TOKEN=your_token (Unix)"
  );
  process.exit(1);
}

// Проверка артефактов
for (const artifact of artifacts) {
  if (!fs.existsSync(artifact)) {
    console.error(`❌ Ошибка: файл не найден: ${artifact}`);
    process.exit(1);
  }
}

// Функция для выполнения HTTP запроса
function makeRequest(method, pathname, data = null, isUpload = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      port: 443,
      path: pathname,
      method: method,
      headers: {
        "Authorization": `token ${CONFIG.token}`,
        "User-Agent": "BadPhone-Release-Script",
        "Accept": "application/vnd.github+json",
      },
    };

    if (isUpload && data) {
      options.headers["Content-Type"] = "application/octet-stream";
      options.headers["Content-Length"] = data.length;
    } else if (data) {
      const jsonData = JSON.stringify(data);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        } else {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        }
      });
    });

    req.on("error", reject);

    if (data) {
      if (isUpload) {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }

    req.end();
  });
}

// Основная функция
async function createRelease() {
  try {
    console.log("🚀 Начинаем создание релиза BadPhone v" + version);
    console.log("📦 Владелец:", CONFIG.owner);
    console.log("📦 Репозиторий:", CONFIG.repo);
    console.log("📋 Вер сия:", version);
    console.log("📝 Черновик:", isDraft ? "Да" : "Нет");
    console.log("⚡ Предварительный релиз:", prerelease ? "Да" : "Нет");

    if (artifacts.length > 0) {
      console.log("📎 Артефакты:");
      artifacts.forEach((a) => console.log("   -", path.basename(a)));
    }

    // 1. Читаем package.json для получения информации о версии
    const packageJsonPath = path.join(__dirname, "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    // 2. Генерируем заметки о релизе (если не указаны)
    if (!releaseNotes) {
      releaseNotes = generateReleaseNotes(version, packageJson);
    }

    // 3. Создаём релиз на GitHub
    console.log("\n⏳ Создаём релиз на GitHub...");

    const releaseData = {
      tag_name: `v${version}`,
      name: `v${version}`,
      body: releaseNotes,
      draft: isDraft,
      prerelease: prerelease,
      generate_release_notes: false,
    };

    const releaseResponse = await makeRequest(
      "POST",
      `/repos/${CONFIG.owner}/${CONFIG.repo}/releases`,
      releaseData
    );

    console.log("✅ Релиз создан!");
    console.log("   URL:", releaseResponse.html_url);
    console.log("   ID:", releaseResponse.id);

    // 4. Загружаем артефакты (если есть)
    if (artifacts.length > 0) {
      console.log("\n⏳ Загружаем артефакты...");

      for (const artifactPath of artifacts) {
        const fileName = path.basename(artifactPath);
        const fileData = fs.readFileSync(artifactPath);

        console.log(`   Загружаем: ${fileName}...`);

        const uploadPath = `/repos/${CONFIG.owner}/${CONFIG.repo}/releases/${releaseResponse.id}/assets?name=${encodeURIComponent(fileName)}`;

        try {
          const assetResponse = await makeRequest(
            "POST",
            uploadPath,
            fileData,
            true
          );
          console.log(`   ✅ Загруженa: ${fileName}`);
          console.log(`      Размер: ${(fileData.length / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
          console.error(`   ❌ Ошибка при загрузке ${fileName}:`, error.message);
        }
      }
    }

    console.log("\n✅ Релиз успешно создан!");
    console.log(
      `📋 Просмотреть: https://github.com/${CONFIG.owner}/${CONFIG.repo}/releases/tag/v${version}`
    );

    return releaseResponse;
  } catch (error) {
    console.error("\n❌ Ошибка при создании релиза:");
    console.error(error.message);
    process.exit(1);
  }
}

// Генерирует заметки о релизе автоматически
function generateReleaseNotes(version, packageJson) {
  const date = new Date().toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const features = [
    "Улучшена производительность приложения",
    "Исправлены ошибки в интерфейсе",
    "Обновлены зависимости",
  ];

  return `# BadPhone v${version}

**Выпущено:** ${date}

## 📝 Заметки о релизе

Эта версия включает следующие обновления:

${features.map((f) => `- ${f}`).join("\n")}

## 📦 Загрузить

Выберите установщик для вашей операционной системы ниже.

## 💻 Требования

- Windows 10 / 11 (x64)
- Интернет-соединение

## 🔐 Проверка целостности

Все артефакты подписаны и проверены.

---

[Посмотреть все релизы](https://github.com/${CONFIG.owner}/${CONFIG.repo}/releases)`;
}

// Запускаем скрипт
createRelease();
