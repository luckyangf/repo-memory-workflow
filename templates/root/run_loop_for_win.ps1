param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"

$ProjectRoot = if ($env:PROJECT_ROOT) { (Resolve-Path -LiteralPath $env:PROJECT_ROOT).Path } else { (Get-Location).Path }
$MaxRounds = if ($env:MAX_ROUNDS) { [int]$env:MAX_ROUNDS } else { 10 }
$RoundTimeout = if ($env:ROUND_TIMEOUT) { [int]$env:ROUND_TIMEOUT } else { 1800 }
$MaxFailures = if ($env:MAX_FAILURES) { [int]$env:MAX_FAILURES } else { 3 }
$CodexBin = if ($env:CODEX_BIN) { $env:CODEX_BIN } else { "codex" }
$StopFile = if ($env:STOP_FILE) { $env:STOP_FILE } else { ".ai/STOP" }
$LogDir = if ($env:LOG_DIR) { $env:LOG_DIR } else { ".ai/run_logs" }

function Write-Stderr {
  param([string]$Message)
  [Console]::Error.WriteLine($Message)
}

function Resolve-ProjectPath {
  param([string]$Path)
  if ([System.IO.Path]::IsPathRooted($Path)) {
    return $Path
  }
  return [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $Path))
}

function Show-Usage {
  @"
repo-memory-workflow run loop for Windows

Usage:
  .\run_loop_for_win.ps1 [options]

By default each round runs: codex exec --cd <project> --skip-git-repo-check --full-auto -

Options:
  --max-rounds <n>       Maximum exec rounds (default: 10)
  --timeout <seconds>    Per-round timeout in seconds (default: 1800)
  --max-failures <n>     Consecutive failure limit (default: 3)
  --codex-bin <path>     Codex executable (default: codex)
  --stop-file <path>     Stop file path (default: .ai/STOP)
  -h, --help             Show help

Environment variables with the same names are also supported:
  PROJECT_ROOT, MAX_ROUNDS, ROUND_TIMEOUT, MAX_FAILURES, CODEX_BIN, STOP_FILE, LOG_DIR
"@
}

$i = 0
while ($i -lt $RemainingArgs.Count) {
  switch ($RemainingArgs[$i]) {
    "--max-rounds" {
      $i++
      if ($i -ge $RemainingArgs.Count) { throw "[run_loop] Missing value for --max-rounds" }
      $MaxRounds = [int]$RemainingArgs[$i]
    }
    "--timeout" {
      $i++
      if ($i -ge $RemainingArgs.Count) { throw "[run_loop] Missing value for --timeout" }
      $RoundTimeout = [int]$RemainingArgs[$i]
    }
    "--max-failures" {
      $i++
      if ($i -ge $RemainingArgs.Count) { throw "[run_loop] Missing value for --max-failures" }
      $MaxFailures = [int]$RemainingArgs[$i]
    }
    "--codex-bin" {
      $i++
      if ($i -ge $RemainingArgs.Count) { throw "[run_loop] Missing value for --codex-bin" }
      $CodexBin = $RemainingArgs[$i]
    }
    "--stop-file" {
      $i++
      if ($i -ge $RemainingArgs.Count) { throw "[run_loop] Missing value for --stop-file" }
      $StopFile = $RemainingArgs[$i]
    }
    { $_ -eq "-h" -or $_ -eq "--help" } {
      Show-Usage
      exit 0
    }
    default {
      Write-Stderr "[run_loop] Unknown option: $($RemainingArgs[$i])"
      Show-Usage
      exit 2
    }
  }
  $i++
}

Set-Location -LiteralPath $ProjectRoot
$StopFilePath = Resolve-ProjectPath $StopFile
$LogDirPath = Resolve-ProjectPath $LogDir

function Require-File {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath (Resolve-ProjectPath $Path) -PathType Leaf)) {
    Write-Stderr "[run_loop] Missing required file: $Path"
    exit 1
  }
}

function Command-Exists {
  param([string]$Command)
  return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Next-IsComplete {
  $nextPath = Resolve-ProjectPath ".ai/NEXT.md"
  if (-not (Test-Path -LiteralPath $nextPath -PathType Leaf)) {
    return $false
  }
  return [bool](Select-String -LiteralPath $nextPath -Pattern "^(status:\s*(complete|done)|NO_NEXT_ACTION)" -Quiet)
}

function Fingerprint-OrZero {
  param([string]$Path)
  $resolved = Resolve-ProjectPath $Path
  if (-not (Test-Path -LiteralPath $resolved)) {
    return "0"
  }
  $item = Get-Item -LiteralPath $resolved
  if ($item.PSIsContainer) {
    return "0"
  }
  $hash = Get-FileHash -LiteralPath $resolved -Algorithm SHA256
  return "$($hash.Hash):$($item.Length)"
}

function Build-Prompt {
  param([int]$Round)
  @"
You are running repo-memory-workflow automated relay round $Round.

This is a fresh non-interactive Codex exec session. Do not rely on previous
chat history. Recover context only from repository files.

First read these files, in this order:
- AGENTS.md
- .ai/PROMPT_START.md
- .ai/TASK.md
- .ai/STATE.md
- .ai/DECISIONS.md
- .ai/NEXT.md

This round must execute only the first actionable item in .ai/NEXT.md.
If .ai/NEXT.md is unclear, do not guess. Checkpoint the blocker instead.

Before ending this round, you must update:
- .ai/STATE.md with current status, files changed, validation, risks, and next step
- .ai/NEXT.md with the single next action for the following round, or "status: complete"
- .ai/LOG.md with this round's summary
- .ai/DECISIONS.md if an important technical decision changed

If tests or commands fail, write the failure details and recovery suggestion to
.ai/STATE.md, .ai/NEXT.md, and .ai/LOG.md before exiting.

Do not do unrelated refactors. Do not execute multiple task phases in this round.
"@
}

function Invoke-CodexRound {
  param(
    [string]$PromptFile,
    [string]$RunnerFile,
    [string]$OutputFile,
    [int]$TimeoutSeconds
  )

  $cmd = @"
@echo off
cd /d "$ProjectRoot"
type "$PromptFile" | "$CodexBin" exec --cd "$ProjectRoot" --skip-git-repo-check --full-auto - > "$OutputFile" 2>&1
exit /b %ERRORLEVEL%
"@
  Set-Content -LiteralPath $RunnerFile -Value $cmd -Encoding ASCII

  $process = Start-Process -FilePath "cmd.exe" -ArgumentList @("/d", "/s", "/c", "call `"$RunnerFile`"") -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru
  $completed = $process.WaitForExit($TimeoutSeconds * 1000)

  if (-not $completed) {
    Add-Content -LiteralPath $OutputFile -Value "[run_loop] Round timed out after $TimeoutSeconds seconds"
    try {
      & taskkill /PID $process.Id /T /F | Out-Null
    } catch {
      Add-Content -LiteralPath $OutputFile -Value "[run_loop] taskkill failed: $($_.Exception.Message)"
    }
    return 124
  }

  if ($null -eq $process.ExitCode) {
    return 1
  }
  return [int]$process.ExitCode
}

Require-File "AGENTS.md"
Require-File ".ai/TASK.md"
Require-File ".ai/STATE.md"
Require-File ".ai/DECISIONS.md"
Require-File ".ai/NEXT.md"
Require-File ".ai/PROMPT_START.md"

if (-not (Command-Exists $CodexBin)) {
  Write-Stderr "[run_loop] Codex executable not found: $CodexBin"
  Write-Stderr "[run_loop] Install Codex CLI or pass --codex-bin <path>."
  exit 127
}

New-Item -ItemType Directory -Force -Path $LogDirPath | Out-Null

$failures = 0
$round = 1

Write-Host "[run_loop] Starting relay loop"
Write-Host "[run_loop] project_root=$ProjectRoot"
Write-Host "[run_loop] max_rounds=$MaxRounds timeout=$RoundTimeout max_failures=$MaxFailures codex_bin=$CodexBin"
Write-Host "[run_loop] codex_args=exec --cd `"$ProjectRoot`" --skip-git-repo-check --full-auto -"

while ($round -le $MaxRounds) {
  if (Test-Path -LiteralPath $StopFilePath -PathType Leaf) {
    Write-Host "[run_loop] Stop file found: $StopFile"
    exit 0
  }

  if (Next-IsComplete) {
    Write-Host "[run_loop] NEXT indicates completion. Stopping."
    exit 0
  }

  $promptFile = Join-Path $LogDirPath "round_${round}_prompt.md"
  $runnerFile = Join-Path $LogDirPath "round_${round}_run.cmd"
  $outputFile = Join-Path $LogDirPath "round_${round}_output.log"
  $prompt = Build-Prompt $round
  Set-Content -LiteralPath $promptFile -Value $prompt -Encoding UTF8

  $stateBefore = Fingerprint-OrZero ".ai/STATE.md"
  $nextBefore = Fingerprint-OrZero ".ai/NEXT.md"
  $logBefore = Fingerprint-OrZero ".ai/LOG.md"

  Write-Host "[run_loop] Round $round starting"
  Write-Host "[run_loop] Round $round prompt=$promptFile runner=$runnerFile output=$outputFile"
  $code = Invoke-CodexRound -PromptFile $promptFile -RunnerFile $runnerFile -OutputFile $outputFile -TimeoutSeconds $RoundTimeout

  $stateAfter = Fingerprint-OrZero ".ai/STATE.md"
  $nextAfter = Fingerprint-OrZero ".ai/NEXT.md"
  $logAfter = Fingerprint-OrZero ".ai/LOG.md"

  if ($code -eq 0 -and (($stateBefore -ne $stateAfter) -or ($nextBefore -ne $nextAfter) -or ($logBefore -ne $logAfter))) {
    Write-Host "[run_loop] Round $round completed"
    $failures = 0
  } else {
    $failures++
    Write-Stderr "[run_loop] Round $round failed or did not checkpoint (exit=$code, failures=$failures)"
    Write-Stderr "[run_loop] See $outputFile"
    if ($failures -ge $MaxFailures) {
      Write-Stderr "[run_loop] Consecutive failure limit reached"
      exit 1
    }
  }

  $round++
}

Write-Host "[run_loop] Maximum rounds reached: $MaxRounds"
