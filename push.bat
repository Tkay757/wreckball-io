@echo off
set PATH=C:\Users\thani\AppData\Local\Programs\MinGit\cmd;%PATH%
cd /d "%~dp0"
echo ==============================================
echo Pushing WreckBall.io to GitHub...
echo ==============================================
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ==============================================
    echo [SUCCESS] Pushed to https://github.com/Tkay757/wreckball-io
    echo ==============================================
) else (
    echo ==============================================
    echo [NOTE] If prompted, sign in via browser or paste a GitHub Personal Access Token.
    echo ==============================================
)
pause
