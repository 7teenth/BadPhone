Param(
    [string]$newVersion
)

# Пути
$packageJson = "package.json"
$distDir = "dist"
$loginPagePath = "app/components/auth/login-page.tsx" # путь к файлу, где отображается версия

# =========================
# 1️⃣ Получаем последний тег и формируем версию
# =========================
if (-not $newVersion) {
    $tags = git tag --list "v*" | Where-Object { $_ -match "^v\d+\.\d+\.\d+$" } | Sort-Object { [version]($_.TrimStart('v')) }
    $lastTag = if ($tags) { $tags[-1] } else { "v1.0.0" }

    $verParts = $lastTag.TrimStart("v").Split(".")
    $verParts[2] = ([int]$verParts[2] + 1).ToString() # инкремент патча
    $newVersion = "$($verParts[0]).$($verParts[1]).$($verParts[2])"
}

Write-Host "📦 Releasing version: $newVersion"

# =========================
# 2️⃣ Обновляем package.json и package-lock.json
# =========================
$json = Get-Content $packageJson -Raw | ConvertFrom-Json
$json.version = $newVersion
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($packageJson, ($json | ConvertTo-Json -Depth 10 -Compress), $utf8NoBom)

Write-Host "✅ package.json updated"

npm install

# =========================
# 3️⃣ Обновляем версию на странице логина
# =========================
if (Test-Path $loginPagePath) {
    (Get-Content $loginPagePath) |
        ForEach-Object { $_ -replace 'Версія\s+\d+\.\d+\.\d+', "Версія $newVersion" } |
        Set-Content -Encoding utf8 $loginPagePath
    Write-Host "✅ Login page version updated"
}

# =========================
# 4️⃣ Коммитим изменения и пушим
# =========================
git add $packageJson, $loginPagePath
git commit -m "chore: bump version to $newVersion"

$branch = git branch --show-current
git push origin $branch

# =========================
# 5️⃣ Создаем тег
# =========================
if (git tag --list | Select-String "v$newVersion") {
    git tag -d v$newVersion
    git push origin :refs/tags/v$newVersion
}
git tag v$newVersion
git push origin v$newVersion
Write-Host "✅ Git tag v$newVersion created"

# =========================
# 6️⃣ Очищаем старые билды
# =========================
if (Test-Path $distDir) {
    Remove-Item $distDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Old dist folder cleared"
}

# =========================
# 7️⃣ Сборка Next.js с env
# =========================
Write-Host "🚀 Building Next.js static export..."

# Загружаем переменные из .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*([^#=]+)=(.+)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# NEXT_PUBLIC_APP_VERSION доступно для фронтенда
$env:NEXT_PUBLIC_APP_VERSION = $newVersion

npm run build:static

# =========================
# 8️⃣ Сборка Electron
# =========================
Write-Host "🚀 Building Electron app..."
npx electron-builder --win --publish never

# =========================
# 9️⃣ Публикация на GitHub
# =========================
if ($env:GH_TOKEN -or $env:GITHUB_TOKEN) {
    Write-Host "📤 Publishing release on GitHub..."
    $artifacts = Get-ChildItem "$distDir/*.exe" -ErrorAction SilentlyContinue
    if ($artifacts.Count -eq 0) { Write-Host "⚠️ No artifacts found"; exit 1 }

    $releaseArgs = @("scripts/create-github-release.js", "--version", $newVersion, "--draft", "false", "--prerelease", "false")
    foreach ($artifact in $artifacts) {
        $releaseArgs += "--artifact"
        $releaseArgs += $artifact.FullName
    }

    node @releaseArgs
}

Write-Host "`n✅ Release v$newVersion completed!"
