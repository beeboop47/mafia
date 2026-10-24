[CmdletBinding()]
param(
    [string]$Message = 'Update Mafia website',
    [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

function Invoke-ProjectGit {
    param([string[]]$GitArguments)
    & git @GitArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Git could not complete '$($GitArguments[0])'. Nothing will be force-pushed."
    }
}

Push-Location -LiteralPath $PSScriptRoot
try {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Install Git for Windows before publishing.' }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js before publishing.' }
    $repositoryRoot = & git rev-parse --show-toplevel
    if ($LASTEXITCODE -ne 0) { throw 'This folder is not connected to Git.' }
    if ((Resolve-Path -LiteralPath $repositoryRoot).Path -ne (Resolve-Path -LiteralPath $PSScriptRoot).Path) {
        throw 'Run this script from its own Mafia repository.'
    }
    $remote = & git remote get-url origin
    if ($LASTEXITCODE -ne 0 -or $remote -ne 'https://github.com/beeboop47/mafia.git') {
        throw 'The origin remote must point to https://github.com/beeboop47/mafia.git.'
    }
    $branch = & git branch --show-current
    if ($branch -ne 'main') { throw 'Switch to the main branch before publishing.' }
    if ([string]::IsNullOrWhiteSpace($Message)) { throw 'Enter a commit message.' }

    Write-Host 'Checking website scripts...'
    foreach ($scriptFile in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.js' -File) {
        & node --check $scriptFile.FullName
        if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $($scriptFile.Name). Publishing stopped." }
    }
    $inlineSyntaxCheck = @'
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
let count = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/i.test(match[1])) continue;
    new vm.Script(match[2], {filename: 'index.html:inline-' + (++count)});
}
if (!count) throw new Error('No inline website scripts found.');
'@
    $inlineSyntaxCheck | & node -
    if ($LASTEXITCODE -ne 0) { throw 'The inline website script failed its syntax check. Publishing stopped.' }
    Write-Host 'Running the game tests...'
    & node --test 'tests/*.test.cjs'
    if ($LASTEXITCODE -ne 0) { throw 'Game tests failed. Publishing stopped before staging or uploading.' }
    if ($CheckOnly) {
        Write-Host 'Checks passed. No files were staged, committed or uploaded.' -ForegroundColor Green
        return
    }

    Write-Host 'Checking for changes already on GitHub...'
    Invoke-ProjectGit -GitArguments @('fetch', 'origin', 'main')
    & git merge-base --is-ancestor origin/main HEAD
    if ($LASTEXITCODE -ne 0) {
        throw 'GitHub has changes this folder does not contain. Merge those changes before publishing; no files have been overwritten.'
    }

    # Explicit project paths prevent the local fallback or unrelated files being uploaded.
    $publishPaths = @(
        '.gitignore', 'Publish.ps1', 'Publish.cmd', 'index.html', 'polish.css',
        'abilities.js', 'ambience.js', 'customisation.js', 'host-setup.js', 'judge.js',
        'narrator.js', 'online-reactions.js', 'reactions.js', 'roles.js', 'signal-receiver.js',
        'README.md', 'Mafia Playbook.md', 'Expansion Guide.md', 'Customisation Guide.md',
        'Ability and Reaction Review.md', 'assets', 'tests'
    )
    Invoke-ProjectGit -GitArguments (@('add', '-A', '--') + $publishPaths)
    & git diff --cached --quiet -- @publishPaths
    $diffResult = $LASTEXITCODE
    if ($diffResult -gt 1) { throw 'Could not inspect the staged project files.' }
    if ($diffResult -eq 1) {
        Invoke-ProjectGit -GitArguments (@('commit', '--only', '-m', $Message, '--') + $publishPaths)
    }
    $pending = & git rev-list --count origin/main..HEAD
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect the pending commits.' }
    if ([int]$pending -eq 0) {
        Write-Host 'GitHub is already up to date.' -ForegroundColor Green
        return
    }
    Write-Host 'Uploading the tested changes to GitHub...'
    Invoke-ProjectGit -GitArguments @('push', 'origin', 'HEAD:main')
    Write-Host 'Published successfully to beeboop47/mafia.' -ForegroundColor Green
}
catch {
    Write-Host "Publishing stopped: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
