@echo off
 g++ -std=c++17 -O2 -Wall main.cpp -o mini_lex.exe
if errorlevel 1 exit /b 1
mini_lex.exe specs\clike.lex samples\program.c.txt
pause
