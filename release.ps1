Param(
    [string]$newVersion
)

# Файлы проекта
$packageJson = "package.json"
$packageLock = "package-lock.json"
$distDir = "dist"

# =========================
# 1️⃣ Авто-инкремент версии
# =========================
if (-not $newVersion) {
    $content = Get-Content $packageJson -Raw | ConvertFrom-Json
    $verParts = $content.version.Split('.')
    $verParts[2] = ([int]$verParts[2] + 1).ToString()
    $newVersion = "$($verParts[0]).$($verParts[1]).$($verParts[2])"
}
Write-Host "Auto-updated version: $newVersion"

# =========================
# 2️⃣ Обновление package.json и package-lock.json
# =========================
Write-Host "Updating package.json..."
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$json = Get-Content $packageJson -Raw | ConvertFrom-Json
$json.version = $newVersion
[System.IO.File]::WriteAllText($packageJson, ($json | ConvertTo-Json -Depth 10 -Compress), $utf8NoBom)

Write-Host "Updating package-lock.json..."
npm install

# =========================
# 3️⃣ Создание коммита и пуш
# =========================
Write-Host "Creating commit with new version..."
git add .
git commit -m "feat: prepare version $newVersion"

$branch = git branch --show-current
Write-Host "Pushing changes to branch $branch..."
git push origin $branch

# =========================
# 4️⃣ Создание тега
# =========================
if (git tag --list | Select-String "v$newVersion") {
    Write-Host "Tag v$newVersion already exists. Deleting..."
    git tag -d v$newVersion
    git push origin :refs/tags/v$newVersion
}

Write-Host "Creating tag v$newVersion..."
git tag v$newVersion
git push origin v$newVersion

# =========================
# 5️⃣ Очистка старых билдов
# =========================
Write-Host "Cleaning old builds..."
if (Test-Path $distDir) {
    Get-ChildItem "$distDir\*.exe" -ErrorAction SilentlyContinue | Remove-Item -Force
    Get-ChildItem "$distDir\*.blockmap" -ErrorAction SilentlyContinue | Remove-Item -Force
}

# =========================
# 6️⃣ Сборка Electron
# =========================
Write-Host "Building the app..."
npx electron-builder --win

$artifacts = @(Get-ChildItem "$distDir/*.exe" -ErrorAction SilentlyContinue)

if ($artifacts.Count -eq 0) {
    Write-Host "`n⚠️ No build artifacts found in $distDir/"
    exit 1
}

# =========================
# 7️⃣ Публикация на GitHub (если токен есть)
# =========================
if ($env:GH_TOKEN -or $env:GITHUB_TOKEN) {
    Write-Host "`nCreating GitHub release..."
    $releaseArgs = @("scripts/create-github-release.js", "--version", $newVersion, "--draft", "false", "--prerelease", "false")
    
    foreach ($artifact in $artifacts) {
        $releaseArgs += "--artifact"
        $releaseArgs += $artifact.FullName
    }
    
    node @releaseArgs

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ GitHub release v$newVersion created successfully!"
    } else {
        Write-Host "`n⚠️ Error while creating GitHub release"
    }
} else {
    Write-Host "`n⚠️ GH_TOKEN or GITHUB_TOKEN is not set. Skipping GitHub release."
}

Write-Host "`n✅ Automatic release v$newVersion completed!"
