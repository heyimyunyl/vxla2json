@shift /0
SetLocal EnableDelayedExpansion
$global:ProgressPreference = 'SilentlyContinue'
@echo off
TITLE vxla2json by Yunyl
mode con: cols=84 lines=32
echo.
echo vxla2json, made by Yunyl (1.0.0)
echo This is a tool for converting Let's Sing and Dance file system to Just Dance to make it play-able on UbiArt Framework.
echo ----------------------------
echo.
SET /p _UpperCodename="Please enter the original codename of the song: "
node vxla2json.js %_UpperCodename%
pause
ENDLOCAL
GOTO:EOF