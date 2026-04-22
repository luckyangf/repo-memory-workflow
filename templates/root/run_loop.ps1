param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

$ErrorActionPreference = "Stop"

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

function Show-Usage {
  @"
repo-memory-workflow run loop

Usage:
  .\run_loop.ps1 [options]

By default each round runs: codex exec "<fresh relay prompt>"

Options:
  --max-rounds <n>       Maximum exec rounds (default: 10)
  --timeout <seconds>    Per-round timeout in seconds (default: 1800)
  --max-failures <n>     Consecutive failure limit (default: 3)
  --codex-bin <path>     Codex executable (default: codex)
  --stop-file <path>     Stop file path (default: .ai/STOP)
  -h, --help             Show help

Environment variables with the same names are also supported:
  MAX_ROUNDS, ROUND_TIMEOUT, MAX_FAILURES, CODEX_BIN, STOP_FILE, LOG_DIR
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

function Require-File {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    Write-Stderr "[run_loop] Missing required file: $Path"
    exit 1
  }
}

function Command-Exists {
  param([string]$Command)
  return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Next-IsComplete {
  if (-not (Test-Path -LiteralPath ".ai/NEXT.md" -PathType Leaf)) {
    return $false
  }
  return [bool](Select-String -LiteralPath ".ai/NEXT.md" -Pattern "^(status:\s*(complete|done)|NO_NEXT_ACTION)" -Quiet)
}

function Fingerprint-OrZero {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return "0"
  }
  $item = Get-Item -LiteralPath $Path
  if ($item.PSIsContainer) {
    return "0"
  }
  $hash = Get-FileHash -LiteralPath $Path -Algorithm SHA256
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
    [string]$Prompt,
    [string]$OutputFile,
    [int]$TimeoutSeconds
  )

  $job = Start-Job -ScriptBlock {
    param($Bin, $RoundPrompt, $RoundOutput)
    & $Bin exec $RoundPrompt *> $RoundOutput
    if ($null -eq $LASTEXITCODE) { return 0 }
    return $LASTEXITCODE
  } -ArgumentList $CodexBin, $Prompt, $OutputFile

  $finished = Wait-Job $job -Timeout $TimeoutSeconds
  if (-not $finished) {
    Stop-Job $job | Out-Null
    Remove-Job $job -Force | Out-Null
    Add-Content -LiteralPath $OutputFile -Value "[run_loop] Round timed out after $TimeoutSeconds seconds"
    return 124
  }

  $result = @(Receive-Job $job)
  Remove-Job $job | Out-Null
  if ($result.Count -gt 0) {
    return [int]$result[-1]
  }
  return 0
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

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$failures = 0
$round = 1

Write-Host "[run_loop] Starting relay loop"
Write-Host "[run_loop] max_rounds=$MaxRounds timeout=$RoundTimeout max_failures=$MaxFailures codex_bin=$CodexBin"

while ($round -le $MaxRounds) {
  if (Test-Path -LiteralPath $StopFile -PathType Leaf) {
    Write-Host "[run_loop] Stop file found: $StopFile"
    exit 0
  }

  if (Next-IsComplete) {
    Write-Host "[run_loop] NEXT indicates completion. Stopping."
    exit 0
  }

  $promptFile = Join-Path $LogDir "round_${round}_prompt.md"
  $outputFile = Join-Path $LogDir "round_${round}_output.log"
  $prompt = Build-Prompt $round
  Set-Content -LiteralPath $promptFile -Value $prompt -Encoding UTF8

  $stateBefore = Fingerprint-OrZero ".ai/STATE.md"
  $nextBefore = Fingerprint-OrZero ".ai/NEXT.md"
  $logBefore = Fingerprint-OrZero ".ai/LOG.md"

  Write-Host "[run_loop] Round $round starting"
  $code = Invoke-CodexRound -Prompt $prompt -OutputFile $outputFile -TimeoutSeconds $RoundTimeout

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
