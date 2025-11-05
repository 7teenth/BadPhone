Param(
    [string]$newVersion
)

if (-not $newVersion) {
    Write-Host "Ошибка: необходимо указать новую версию. Пример: ./release.ps1 1.0.3"
    exit 1
}

$jsonPath = "package.json"

# ------------------------- 0. Исправляем кодировку -------------------------
Write-Host "Проверяем и исправляем кодировку package.json..."
$content = Get-Content $jsonPath -Raw
# Перезаписываем файл в UTF-8 без BOM
Set-Content -Path $jsonPath -Value $content -Encoding utf8

# ------------------------- 1. Обновление версии -------------------------
Write-Host "Обновляем версию в package.json..."
$json = $content | ConvertFrom-Json
$json.version = $newVersion
$json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding utf8

# ------------------------- 2. Коммит изменений -------------------------
Write-Host "Создаём коммит..."
git add .
git commit -m "feat: подготовка версии $newVersion"

# ------------------------- 3. Пуш на GitHub -------------------------
$branch = git branch --show-current
Write-Host "Пушим изменения на ветку $branch..."
git push origin $branch

# ------------------------- 4. Создаём тег -------------------------
# Если тег уже существует — удаляем старый и создаём новый
if (git tag --list | Select-String "v$newVersion") {
    Write-Host "Тег v$newVersion уже существует. Удаляем старый..."
    git tag -d v$newVersion
    git push origin :refs/tags/v$newVersion
}

Write-Host "Создаём тег v$newVersion..."
git tag v$newVersion
git push origin v$newVersion

# ------------------------- 5. Сборка приложения -------------------------
Write-Host "Сборка приложения..."
npx electron-builder --win

# ------------------------- 6. Публикация на GitHub -------------------------
Write-Host "Публикация релиза на GitHub..."
npx electron-builder --publish always

Write-Host "✅ Релиз v$newVersion успешно создан и опубликован!"
