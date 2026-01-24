# release.ps1
# Полностью автоматический релиз с автоинкрементом патча

# --- Получаем последнюю версию из package.json ---
$jsonPath = "package.json"
$content = Get-Content $jsonPath -Raw
$json = $content | ConvertFrom-Json

# --- Автоинкремент патча ---
$versionParts = $json.version.Split('.')
[int]$patch = [int]$versionParts[2]
$patch++
$versionParts[2] = $patch.ToString()
$newVersion = ($versionParts -join ".")

$json.version = $newVersion
$json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding utf8
Write-Host "Автообновленная версия: $newVersion"

# --- Обновляем package-lock.json ---
Write-Host "Обновляем package-lock.json..."
npm install

# --- Коммит изменений ---
Write-Host "Создаём коммит с новой версией..."
git add .
git commit -m "feat: подготовка версии $newVersion"

$branch = git branch --show-current
Write-Host "Пушим изменения на ветку $branch..."
git push origin $branch

# --- Работа с тегами ---
if (git tag --list | Select-String "v$newVersion") {
    Write-Host "Тег v$newVersion уже существует. Удаляем..."
    git tag -d v$newVersion
    git push origin :refs/tags/v$newVersion
}

Write-Host "Создаём тег v$newVersion..."
git tag v$newVersion
git push origin v$newVersion

# --- Сборка приложения ---
Write-Host "Собираем приложение..."
npx electron-builder --win --x64 --publish always

# --- Проверка артефактов ---
$artifacts = @(Get-ChildItem "dist/*.exe" -ErrorAction SilentlyContinue)

if ($artifacts.Count -gt 0) {
    Write-Host "Найдены артефакты:"
    $artifacts | ForEach-Object { Write-Host "  - $($_.FullName)" }

    if (-not $env:GITHUB_TOKEN) {
        Write-Host "`n⚠️ GITHUB_TOKEN не установлен, релиз на GitHub пропущен."
    } else {
        Write-Host "`nСоздаём релиз на GitHub..."
        $releaseArgs = @("scripts/create-github-release.js", "--version", $newVersion, "--draft", "false", "--prerelease", "false")

        foreach ($artifact in $artifacts) {
            $releaseArgs += "--artifact"
            $releaseArgs += $artifact.FullName
        }

        node @releaseArgs

        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Релиз v$newVersion создан на GitHub!"
        } else {
            Write-Host "`n⚠️ Ошибка при создании релиза"
        }
    }
} else {
    Write-Host "`n⚠️ Артефакты не найдены в dist/"
}

Write-Host "`n✅ Автоматический релиз v$newVersion завершён!"
