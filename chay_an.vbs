' File khoi dong chay an he thong SOS Da Nang (Khong hien cua so den)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

WshShell.CurrentDirectory = currentDir

' Kiem tra neu chua co dist thi tu dong build
If Not fso.FileExists(currentDir & "\dist\index.html") Then
    WshShell.Run "cmd /c npm.cmd run build", 0, True
End If

' Chay node server.js trong che do an (windowStyle = 0)
WshShell.Run "cmd /c node server.js", 0, False

WScript.Sleep 1500
' Mo trinh duyet
WshShell.Run "http://localhost:5000"
