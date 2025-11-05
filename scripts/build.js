const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Начинаем сборку BadPhone POS...\n");

try {
  // Проверяем наличие необходимых файлов
  console.log("📋 Проверяем конфигурацию...");

  if (!fs.existsSync("next.config.mjs")) {
    throw new Error("Файл next.config.mjs не найден!");
  }

  if (!fs.existsSync("electron/main.js")) {
    throw new Error("Файл electron/main.js не найден!");
  }

  console.log("✅ Конфигурация в порядке\n");

  // Очищаем предыдущие сборки
  console.log("🧹 Очищаем предыдущие сборки...");
  if (fs.existsSync("out")) {
    fs.rmSync("out", { recursive: true, force: true });
  }
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
  }
  console.log("✅ Очистка завершена\n");

  // Собираем Next.js приложение
  console.log("⚙️  Собираем Next.js приложение...");

  // Важно: STATIC_EXPORT=true для статического экспорта
  execSync("npx cross-env STATIC_EXPORT=true npm run build", { stdio: "inherit" });
  execSync("npm run export", { stdio: "inherit" });

  console.log("✅ Next.js приложение собрано\n");

  // Проверяем результат сборки
  if (!fs.existsSync("out/index.html")) {
    throw new Error("Сборка Next.js не создала файл index.html!");
  }

  console.log("📦 Создаем Electron приложение...");
  execSync("npx electron-builder --publish=never", { stdio: "inherit" });
  console.log("✅ Electron приложение создано\n");

  // Показываем результаты
  console.log("🎉 Сборка завершена успешно!");
  console.log("\n📁 Результаты сборки:");

  if (fs.existsSync("dist")) {
    const distFiles = fs.readdirSync("dist");
    distFiles.forEach((file) => {
      const filePath = path.join("dist", file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   ${file} (${size} MB)`);
    });
  }

  console.log("\n🚀 Готово! Ваше приложение находится в папке dist/");
} catch (error) {
  console.error("\n❌ Ошибка сборки:", error.message);
  process.exit(1);
}
