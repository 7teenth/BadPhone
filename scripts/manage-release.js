#!/usr/bin/env node

/**
 * Расширенный скрипт для управления релизами с поддержкой changelog
 * 
 * Использование:
 *   node scripts/manage-release.js create --version 1.0.7
 *   node scripts/manage-release.js changelog --from v1.0.6 --to v1.0.7
 *   node scripts/manage-release.js publish --version 1.0.7 --artifacts dist/*.exe
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const command = process.argv[2] || "help";

// Парсинг аргументов
function parseArgs() {
  const args = {};
  for (let i = 3; i < process.argv.length; i += 2) {
    const key = process.argv[i].replace(/^--/, "");
    const value = process.argv[i + 1];
    args[key] = value;
  }
  return args;
}

// Генерирует changelog из git коммитов
function generateChangelog(fromTag, toTag) {
  try {
    const gitLog = execSync(
      `git log ${fromTag}..${toTag} --oneline --decorate`,
      { encoding: "utf-8" }
    );

    const commits = gitLog.trim().split("\n");

    const grouped = {
      features: [],
      fixes: [],
      docs: [],
      style: [],
      refactor: [],
      perf: [],
      test: [],
      chore: [],
      other: [],
    };

    commits.forEach((commit) => {
      const match = commit.match(/^([a-f0-9]+)\s*(.*?):\s*(.*)$/);
      if (match) {
        const [, hash, type, message] = match;
        const shortHash = hash.substring(0, 7);

        const entry = `- ${message} ([${shortHash}](https://github.com/7teenth/BadPhone/commit/${shortHash}))`;

        switch (type.toLowerCase()) {
          case "feat":
            grouped.features.push(entry);
            break;
          case "fix":
            grouped.fixes.push(entry);
            break;
          case "docs":
            grouped.docs.push(entry);
            break;
          case "style":
            grouped.style.push(entry);
            break;
          case "refactor":
            grouped.refactor.push(entry);
            break;
          case "perf":
            grouped.perf.push(entry);
            break;
          case "test":
            grouped.test.push(entry);
            break;
          case "chore":
            grouped.chore.push(entry);
            break;
          default:
            grouped.other.push(`- ${commit}`);
        }
      } else {
        grouped.other.push(`- ${commit}`);
      }
    });

    let changelog = "";

    if (grouped.features.length > 0) {
      changelog += "## ✨ Возможности\n\n" + grouped.features.join("\n") + "\n\n";
    }
    if (grouped.fixes.length > 0) {
      changelog += "## 🐛 Исправления\n\n" + grouped.fixes.join("\n") + "\n\n";
    }
    if (grouped.perf.length > 0) {
      changelog += "## ⚡ Производительность\n\n" + grouped.perf.join("\n") + "\n\n";
    }
    if (grouped.refactor.length > 0) {
      changelog += "## ♻️  Рефакторинг\n\n" + grouped.refactor.join("\n") + "\n\n";
    }
    if (grouped.docs.length > 0) {
      changelog += "## 📚 Документация\n\n" + grouped.docs.join("\n") + "\n\n";
    }
    if (grouped.test.length > 0) {
      changelog += "## ✅ Тесты\n\n" + grouped.test.join("\n") + "\n\n";
    }
    if (grouped.style.length > 0) {
      changelog += "## 🎨 Стиль\n\n" + grouped.style.join("\n") + "\n\n";
    }
    if (grouped.chore.length > 0) {
      changelog += "## 🔧 Обслуживание\n\n" + grouped.chore.join("\n") + "\n\n";
    }
    if (grouped.other.length > 0) {
      changelog += "## 📝 Прочее\n\n" + grouped.other.join("\n") + "\n\n";
    }

    return changelog;
  } catch (error) {
    console.error("Ошибка при генерации changelog:", error.message);
    return null;
  }
}

// Команда: create
function cmdCreate() {
  const args = parseArgs();
  const version = args.version;

  if (!version) {
    console.error("❌ Укажите версию: --version X.Y.Z");
    process.exit(1);
  }

  console.log(`📦 Подготовка к созданию релиза v${version}...`);

  try {
    // Получаем предыдущий тег
    const tags = execSync("git tag --list", { encoding: "utf-8" })
      .trim()
      .split("\n")
      .filter((t) => t.startsWith("v"));

    const previousTag = tags[tags.length - 1] || "HEAD";

    console.log(`📜 Генерируем changelog от ${previousTag} до HEAD...`);

    const changelog = generateChangelog(previousTag, "HEAD");

    if (changelog) {
      console.log("\n" + changelog);
    }

    console.log(`\n✅ Релиз v${version} готов к созданию`);
    console.log(`\n🚀 Следующие шаги:`);
    console.log(`   1. Обновить версию: npm version ${version}`);
    console.log(`   2. Создать релиз: node scripts/create-github-release.js --version ${version}`);
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  }
}

// Команда: changelog
function cmdChangelog() {
  const args = parseArgs();
  const from = args.from || (execSync("git describe --tags --abbrev=0 2>/dev/null", {
    encoding: "utf-8",
  }).trim() || "HEAD");
  const to = args.to || "HEAD";

  console.log(`📜 Генерируем changelog от ${from} до ${to}...\n`);

  const changelog = generateChangelog(from, to);

  if (changelog) {
    console.log(changelog);

    // Сохранить в файл если указано
    if (args.output) {
      fs.writeFileSync(args.output, changelog);
      console.log(`\n✅ Changelog сохранён в ${args.output}`);
    }
  } else {
    console.log("❌ Не удалось сгенерировать changelog");
  }
}

// Команда: publish
function cmdPublish() {
  const args = parseArgs();
  const version = args.version;

  if (!version) {
    console.error("❌ Укажите версию: --version X.Y.Z");
    process.exit(1);
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error("❌ Переменная GITHUB_TOKEN не установлена");
    process.exit(1);
  }

  console.log(`🚀 Публикуем релиз v${version}...`);

  try {
    // Генерируем changelog
    const previousTag = execSync("git describe --tags --abbrev=0 2>/dev/null", {
      encoding: "utf-8",
    })
      .trim() || "HEAD";
    const changelog = generateChangelog(previousTag, "HEAD");

    // Подготавливаем команду
    const cmd = [
      "node",
      "scripts/create-github-release.js",
      "--version",
      version,
      "--draft",
      "false",
      "--prerelease",
      "false",
    ];

    if (changelog) {
      cmd.push("--notes");
      cmd.push(`"${changelog}"`);
    }



    console.log("🔄 Выполняем команду...");
    execSync(cmd.join(" "), { stdio: "inherit" });

    console.log(`\n✅ Релиз v${version} успешно опубликован!`);
  } catch (error) {
    console.error("❌ Ошибка при публикации:", error.message);
  }
}

// Справка
function cmdHelp() {
  console.log(`
📦 BadPhone Release Manager v1.0

Использование:
  node scripts/manage-release.js <команда> [опции]

Команды:

  create          Подготовить релиз
    --version V   Номер версии (X.Y.Z)
    
  changelog       Генерировать changelog
    --from TAG    Начальный тег (default: последний тег)
    --to TAG      Конечный тег (default: HEAD)
    --output FILE Сохранить в файл
    
  publish         Опубликовать релиз на GitHub
    --version V   Номер версии (обязательно)
    --artifacts P Путь к артефактам (например: dist/*.exe)
    
  help            Показать эту справку

Примеры:

  # Подготовить новый релиз
  node scripts/manage-release.js create --version 1.0.8

  # Просмотреть изменения с последнего релиза
  node scripts/manage-release.js changelog

  # Сохранить changelog в файл
  node scripts/manage-release.js changelog --output CHANGELOG.md

  # Опубликовать релиз
  node scripts/manage-release.js publish --version 1.0.8 --artifacts "dist/*.exe"

🔐 Требуется переменная окружения GITHUB_TOKEN для команды 'publish'
  `);
}

// Главная функция
switch (command.toLowerCase()) {
  case "create":
    cmdCreate();
    break;
  case "changelog":
    cmdChangelog();
    break;
  case "publish":
    cmdPublish();
    break;
  case "help":
  case "--help":
  case "-h":
    cmdHelp();
    break;
  default:
    console.error(`❌ Неизвестная команда: ${command}\n`);
    cmdHelp();
    process.exit(1);
}
