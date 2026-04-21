$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $PSScriptRoot 'logs'

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$forwards = @(
    @{ Name = 'frontend'; Port = 5173 },
    @{ Name = 'auth-service'; Port = 8081 },
    @{ Name = 'doctor-service'; Port = 8082 },
    @{ Name = 'patient-service'; Port = 8083 },
    @{ Name = 'notification-service'; Port = 8084 },
    @{ Name = 'appointment-service'; Port = 8085 },
    @{ Name = 'payment-service'; Port = 8086 }
)

foreach ($forward in $forwards) {
    $service = $forward.Name
    $port = $forward.Port
    $logFile = Join-Path $logDir "$service-port-forward.log"
    $command = @"
while (`$true) {
    try {
        kubectl -n smart-healthcare port-forward svc/$service ${port}:${port} *>> '$logFile'
    } catch {
        `$_.Exception.Message | Out-File -FilePath '$logFile' -Append
    }

    Start-Sleep -Seconds 2
}
"@

    Start-Process powershell -ArgumentList @(
        '-NoProfile',
        '-WindowStyle', 'Minimized',
        '-Command', $command
    ) -WorkingDirectory $root | Out-Null
}

Write-Host 'Port forwarding started in separate PowerShell processes.'
Write-Host 'Frontend: http://localhost:5173'
Write-Host 'APIs: localhost:8081..8086'
Write-Host "Logs: $logDir"
