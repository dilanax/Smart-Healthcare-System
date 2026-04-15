$jobs = @()

$jobs += Start-Job -ScriptBlock { kubectl -n smart-healthcare port-forward svc/frontend 5173:5173 }
$jobs += Start-Job -ScriptBlock { kubectl -n smart-healthcare port-forward svc/auth-service 8081:8081 }
$jobs += Start-Job -ScriptBlock { kubectl -n smart-healthcare port-forward svc/doctor-service 8082:8082 }
$jobs += Start-Job -ScriptBlock { kubectl -n smart-healthcare port-forward svc/patient-service 8083:8083 }
$jobs += Start-Job -ScriptBlock { kubectl -n smart-healthcare port-forward svc/notification-service 8084:8084 }
$jobs += Start-Job -ScriptBlock { kubectl -n smart-healthcare port-forward svc/appointment-service 8085:8085 }
$jobs += Start-Job -ScriptBlock { kubectl -n smart-healthcare port-forward svc/payment-service 8086:8086 }

Write-Host "Port forwarding started in background jobs."
Write-Host "Frontend: http://localhost:5173"
Write-Host "APIs: localhost:8081..8086"
Write-Host "Run 'Get-Job' to see job status."
Write-Host "Run 'Stop-Job *; Remove-Job *' to stop all forwards."

