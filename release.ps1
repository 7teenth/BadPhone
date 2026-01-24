# release.ps1
# Fully automated release script for Windows + PowerShell 5

# --- Auto-increment patch version ---
$jsonPath = "package.json"

# Read current version from package.json
$content = Get-Content $jsonPath -Raw
$json = $content | ConvertFrom-Json
$versionParts = $json.version.Split('.')
[int]$patch = [int]$versionParts[2]
$patch++
$newVersion = "$($versionParts[0]).$($versionParts[1]).$patch"

Write-Host "Auto-updated version: $newVersion"

# --- Update package.json via Node.js (no BOM, valid JSON) ---
Write-Host "Updating package.json using Node.js..."
node -e "
const fs = require('fs');
const p = 'package.json';
const j = require('./' + p);
j.version = '$newVersion';
fs.writeFileSync(p, JSON.stringify(j, null, 2));
"

# --- Update package-lock.json ---
Write-Host "Updating package-lock.json..."
npm install

# --- Commit changes ---
Write-Host "Creating commit with new version..."
git add .
git commit -m "feat: prepare version $newVersion"

$branch = git branch --show-current
Write-Host "Pushing changes to branch $branch..."
git push origin $branch

# --- Handle Git tags ---
if (git tag --list | Select-String "v$newVersion") {
    Write-Host "Tag v$newVersion already exists. Deleting..."
    git tag -d v$newVersion
    git push origin :refs/tags/v$newVersion
}

Write-Host "Creating tag v$newVersion..."
git tag v$newVersion
git push origin v$newVersion

# --- Build Electron app ---
Write-Host "Building the app..."
npx electron-builder --win --x64 --publish always

# --- Check build artifacts ---
$artifacts = @(Get-ChildItem "dist/*.exe" -ErrorAction SilentlyContinue)

if ($artifacts.Count -gt 0) {
    Write-Host "Found artifacts:"
    $artifacts | ForEach-Object { Write-Host "  - $($_.FullName)" }

    # --- GitHub release ---
    if (-not $env:GITHUB_TOKEN) {
        Write-Host "`n⚠️ GITHUB_TOKEN is not set, skipping GitHub release."
    } else {
        Write-Host "`nCreating GitHub release..."
        $releaseArgs = @("scripts/create-github-release.js", "--version", $newVersion, "--draft", "false", "--prerelease", "false")
        foreach ($artifact in $artifacts) {
            $releaseArgs += "--artifact"
            $releaseArgs += $artifact.FullName
        }
        node @releaseArgs

        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ GitHub release v$newVersion created!"
        } else {
            Write-Host "`n⚠️ Error creating GitHub release"
        }
    }
} else {
    Write-Host "`n⚠️ No artifacts found in dist/"
}

Write-Host "`n✅ Automatic release v$newVersion completed!"

