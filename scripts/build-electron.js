const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Начинаем сборку Electron приложения...")

try {
  // Проверяем наличие необходимых файлов
  if (!fs.existsSync("electron/main.js")) {
    throw new Error("Файл electron/main.js не найден")
  }

  console.log("📦 Устанавливаем зависимости...")
  execSync("npm install", { stdio: "inherit" })

  console.log("🏗️  Собираем Next.js приложение...")
  execSync("npm run build", { stdio: "inherit" })

  console.log("📤 Экспортируем статические файлы...")
  execSync("npm run export", { stdio: "inherit" })

  console.log("⚡ Собираем Electron приложение...")
  execSync("npm run pack", { stdio: "inherit" })

  console.log("✅ Сборка завершена успешно!")
  console.log("📁 Файлы находятся в папке dist/")
} catch (error) {
  console.error("❌ Ошибка при сборке:", error.message)
  process.exit(1)
}
