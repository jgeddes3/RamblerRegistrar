' RamblerRegistrar — launch a PowerShell script fully hidden (no console window).
' Windows briefly flashes a console window when a Scheduled Task starts
' powershell.exe directly, even with -WindowStyle Hidden. wscript.exe is a
' windowless (GUI-subsystem) host, and Run(..., 0, False) launches PowerShell
' with window style 0 = hidden, so nothing ever appears on screen.
'
' Usage from a Scheduled Task action:
'   Program : wscript.exe
'   Args    : "<path>\run-hidden.vbs" "<path>\the-script.ps1"
Dim args, cmd
Set args = WScript.Arguments
If args.Count < 1 Then WScript.Quit 1
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & args(0) & """"
CreateObject("WScript.Shell").Run cmd, 0, False
