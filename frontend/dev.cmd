@echo off
setlocal

rem PowerShell may block npm.ps1 depending on the local execution policy.
rem Calling npm.cmd avoids that issue on Windows.
call npm.cmd run dev

