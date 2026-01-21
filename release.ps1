Param(
    [string]$newVersion
)

if (-not $newVersion) {
    Write-Host "Ошибка: необходимо указать новую версию. Пример: ./release.ps1 1.0.7"
    exit 1
}

$jsonPath = "package.json"

Write-Host "Обновляем версию в package.json..."
$content = Get-Content $jsonPath -Raw
Set-Content -Path $jsonPath -Value $content -Encoding utf8

$json = $content | ConvertFrom-Json
$json.version = $newVersion
$json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding utf8

Write-Host "Создаём коммит..."
git add .
git commit -m "feat: подготовка версии $newVersion"

$branch = git branch --show-current
Write-Host "Пушим на ветку $branch..."
git push origin $branch

if (git tag --list | Select-String "v$newVersion") {
    Write-Host "Тег v$newVersion уже существует. Удаляем..."
    git tag -d v$newVersion
    git push origin :refs/tags/v$newVersion
}

Write-Host "Создаём тег v$newVersion..."
git tag v$newVersion
git push origin v$newVersion

Write-Host "Собираем приложение..."
npx electron-builder --win

$artifacts = @(Get-ChildItem "dist/*.exe" -ErrorAction SilentlyContinue)

if ($artifacts.Count -gt 0) {
    Write-Host "Найдены артефакты:"
    $artifacts | ForEach-Object { Write-Host "  - $($_.FullName)" }
    
    if (-not $env:GITHUB_TOKEN) {
        Write-Host "`n⚠️ GITHUB_TOKEN не установлен"
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

Write-Host "`n✅ Релиз v$newVersion готов!"
