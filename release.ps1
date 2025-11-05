# release.ps1
Param(
    [string]$newVersion
)

if (-not $newVersion) {
    Write-Host "Ошибка: необходимо указать новую версию. Пример: ./release.ps1 1.0.1"
    exit 1
}

# ------------------------- 1. Обновление package.json -------------------------
Write-Host "Обновляем версию в package.json..."
$jsonPath = "package.json"
$json = Get-Content $jsonPath -Raw | ConvertFrom-Json
$json.version = $newVersion
$json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8

# ------------------------- 2. Коммит изменений -------------------------
Write-Host "Создаём коммит..."
git add .
git commit -m "feat: подготовка версии $newVersion"

# ------------------------- 3. Пуш на GitHub -------------------------
# Определяем текущую ветку
$branch = git branch --show-current
Write-Host "Пушим изменения на ветку $branch..."
git push origin $branch

# ------------------------- 4. Создаём тег -------------------------
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
