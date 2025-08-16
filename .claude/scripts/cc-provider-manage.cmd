@echo off
setlocal enabledelayedexpansion

:: 配置文件路径
set "CONFIG_FILE=%USERPROFILE%\.cc-providers.txt"

:start
cls

:: 显示当前供应商状态
call :show_current_provider

echo.
echo ========================================
echo         Claude Code Provider Manager
echo ========================================
echo.
echo Please select an option:
echo 1. Add Provider
echo 2. Switch Provider
echo 3. List All Providers
echo 4. Unload Current Provider
echo 5. Exit
echo.
set /p choice=Enter your choice (1-5): 

if "%choice%"=="1" goto add_provider
if "%choice%"=="2" goto switch_provider
if "%choice%"=="3" goto list_providers
if "%choice%"=="4" goto unload_provider
if "%choice%"=="5" goto end
echo Invalid option, please try again
pause
goto start

:show_current_provider
echo ========================================
echo         Current Provider Status
echo ========================================
if defined ANTHROPIC_BASE_URL (
    echo Current BASE_URL: %ANTHROPIC_BASE_URL%
) else (
    echo Current BASE_URL: Default ^(Official Claude^)
)
if defined ANTHROPIC_AUTH_TOKEN (
    echo Current AUTH_TOKEN: %ANTHROPIC_AUTH_TOKEN:~0,20%...
) else (
    echo Current AUTH_TOKEN: Default ^(via /login^)
)
goto :eof

:add_provider
echo.
echo ========================================
echo           Add New Provider
echo ========================================
set /p base_url=Enter BASE_URL: 
set /p auth_token=Enter AUTH_TOKEN: 

if "%base_url%"=="" (
    echo Error: BASE_URL cannot be empty
    pause
    goto start
)
if "%auth_token%"=="" (
    echo Error: AUTH_TOKEN cannot be empty
    pause
    goto start
)

:: Check if the same configuration already exists
if exist "%CONFIG_FILE%" (
    for /f "tokens=1,2 delims=|" %%a in (%CONFIG_FILE%) do (
        if "%%a"=="%base_url%" if "%%b"=="%auth_token%" (
            echo Provider already exists, no need to add again
            pause
            goto start
        )
    )
)

:: Add to configuration file
echo %base_url%^|%auth_token% >> "%CONFIG_FILE%"
echo Provider added successfully!
pause
goto start

:switch_provider
echo.
echo ========================================
echo           Switch Provider
echo ========================================
if not exist "%CONFIG_FILE%" (
    echo No provider configuration file found
    pause
    goto start
)

:: Display provider list
set count=0
echo Available providers:
echo 0. Use Default ^(Official Claude^)
for /f "tokens=1,2 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a count+=1
    echo !count!. %%a
)

if %count%==0 (
    echo No available provider configurations
    pause
    goto start
)

echo.
set /p selection=Select provider ^(0-%count%^): 

if "%selection%"=="0" (
    call :unload_provider_silent
    echo Switched to default provider ^(Official Claude^)
    pause
    goto start
)

if %selection% lss 0 (
    echo Invalid option
    pause
    goto start
)
if %selection% gtr %count% (
    echo Invalid option
    pause
    goto start
)

:: Get the selected provider
set current=0
for /f "tokens=1,2 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a current+=1
    if !current!==%selection% (
        setx ANTHROPIC_BASE_URL "%%a" >nul
        setx ANTHROPIC_AUTH_TOKEN "%%b" >nul
        set "ANTHROPIC_BASE_URL=%%a"
        set "ANTHROPIC_AUTH_TOKEN=%%b"
        echo Switched to provider: %%a
        pause
        goto start
    )
)

:list_providers
echo.
echo ========================================
echo           All Providers List
echo ========================================
if not exist "%CONFIG_FILE%" (
    echo No provider configuration file found
    pause
    goto start
)

set count=0
echo 0. Default Provider ^(Official Claude^)
for /f "tokens=1,2 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a count+=1
    echo !count!. %%a
)

if %count%==0 (
    echo No other configurations besides default provider
)

echo.
pause
goto start

:unload_provider
echo.
echo ========================================
echo           Unload Current Provider
echo ========================================
call :unload_provider_silent
echo Current provider unloaded, now using default provider ^(Official Claude^)
pause
goto start

:unload_provider_silent
reg delete "HKCU\Environment" /v ANTHROPIC_BASE_URL /f >nul 2>&1
reg delete "HKCU\Environment" /v ANTHROPIC_AUTH_TOKEN /f >nul 2>&1
set "ANTHROPIC_BASE_URL="
set "ANTHROPIC_AUTH_TOKEN="
:: Notify system of environment variable changes
setx TEMP "%TEMP%" >nul 2>&1
goto :eof

:end
echo Starting Claude Code...
claude