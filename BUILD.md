# Инструкция по сборке POS System в exe файл

## Требования
- Node.js 18+ 
- npm или yarn

## Установка зависимостей
\`\`\`bash
npm install
\`\`\`

## Разработка с Electron
Для запуска в режиме разработки:
\`\`\`bash
npm run electron-dev
\`\`\`

## Сборка exe файла

### Быстрая сборка (только папка)
\`\`\`bash
npm run pack
\`\`\`

### Полная сборка с установщиком
\`\`\`bash
npm run dist
\`\`\`

### Автоматическая сборка
\`\`\`bash
node scripts/build-electron.js
\`\`\`

## Результат сборки
После сборки файлы будут находиться в папке `dist/`:
- `dist/win-unpacked/` - папка с приложением
- `dist/POS System Setup.exe` - установщик

## Настройка иконки
Замените файлы в папке `electron/`:
- `icon.ico` - для Windows (256x256)
- `icon.icns` - для macOS  
- `icon.png` - для Linux (256x256)

## Настройка приложения
Отредактируйте `package.json` в секции `build`:
- `appId` - уникальный ID приложения
- `productName` - название приложения
- Другие параметры сборки

## Устранение проблем

### Ошибка "Module not found"
\`\`\`bash
npm install --save-dev @types/node
\`\`\`

### Проблемы с Supabase в Electron
Убедитесь что переменные окружения настроены правильно.

### Большой размер exe файла
Добавьте в `package.json` секцию `build.files` только необходимые файлы.
\`\`\`

Теперь создадим файл с переменными окружения для production:
