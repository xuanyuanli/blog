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
echo 3. Edit Provider
echo 4. Delete Provider
echo 5. Open Claude in New Window
echo 6. Exit
echo.
set /p choice=Enter your choice (1-6): 

if "%choice%"=="1" goto add_provider
if "%choice%"=="2" goto switch_provider
if "%choice%"=="3" goto edit_provider
if "%choice%"=="4" goto delete_provider
if "%choice%"=="5" goto open_new_window
if "%choice%"=="6" goto end
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
if defined ANTHROPIC_MODEL (
    echo Current MODEL: %ANTHROPIC_MODEL%
) else (
    echo Current MODEL: Default
)
if defined ANTHROPIC_SMALL_FAST_MODEL (
    echo Current SMALL_FAST_MODEL: %ANTHROPIC_SMALL_FAST_MODEL%
) else (
    echo Current SMALL_FAST_MODEL: Default
)
goto :eof

:add_provider
echo.
echo ========================================
echo           Add New Provider
echo ========================================
echo Enter 'C' to cancel at any time
echo.
set /p base_url=Enter BASE_URL: 
if /i "%base_url%"=="C" goto start

if "%base_url%"=="" (
    echo Error: BASE_URL cannot be empty
    pause
    goto start
)

set /p auth_token=Enter AUTH_TOKEN: 
if /i "%auth_token%"=="C" goto start

if "%auth_token%"=="" (
    echo Error: AUTH_TOKEN cannot be empty
    pause
    goto start
)

echo.
echo Optional model settings (press Enter to skip, 'C' to cancel):
set /p model=Enter ANTHROPIC_MODEL (optional): 
if /i "%model%"=="C" goto start

set /p small_fast_model=Enter ANTHROPIC_SMALL_FAST_MODEL (optional): 
if /i "%small_fast_model%"=="C" goto start 

:: Check if the same configuration already exists
if exist "%CONFIG_FILE%" (
    for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
        if "%%a"=="%base_url%" if "%%b"=="%auth_token%" (
            echo Provider already exists, no need to add again
            pause
            goto start
        )
    )
)

:: Add to configuration file with model parameters
echo %base_url%^|%auth_token%^|%model%^|%small_fast_model% >> "%CONFIG_FILE%"
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

:: Display provider list with options
set count=0
echo Available providers:
echo 0. Use Default ^(Official Claude^)
for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a count+=1
    if "%%c"=="" (
        if "%%d"=="" (
            echo !count!. %%a
        ) else (
            echo !count!. %%a ^| Small Fast Model: %%d
        )
    ) else (
        if "%%d"=="" (
            echo !count!. %%a ^| Model: %%c
        ) else (
            echo !count!. %%a ^| Model: %%c ^| Small Fast Model: %%d
        )
    )
)

if %count%==0 (
    echo No available provider configurations
    echo.
    echo C. Return to main menu
    echo.
    set /p selection=Enter your choice ^(C^): 
    if /i "!selection!"=="C" goto start
    echo Invalid option
    pause
    goto start
) else (
    echo.
    echo C. Return to main menu
    echo.
    set /p selection=Select provider ^(0-%count%^) or C to return: 
    
    if /i "!selection!"=="C" goto start
    
    if "!selection!"=="0" (
        call :unload_provider_silent
        echo Switched to default provider ^(Official Claude^)
        pause
        goto start
    )
    
    :: Check if selection is a valid number
    set "valid_number=0"
    if %count% gtr 0 (
        for /l %%i in (1,1,%count%) do (
            if "!selection!"=="%%i" set "valid_number=1"
        )
    )
    
    if "!valid_number!"=="0" (
        echo Invalid option
        pause
        goto start
    )
    
    :: Get the selected provider
    set current=0
    for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
        set /a current+=1
        if !current!==!selection! (
            setx ANTHROPIC_BASE_URL "%%a" >nul
            setx ANTHROPIC_AUTH_TOKEN "%%b" >nul
            set "ANTHROPIC_BASE_URL=%%a"
            set "ANTHROPIC_AUTH_TOKEN=%%b"
            set "model_value=%%c"
            call :trim model_value
            if not "!model_value!"=="" (
                echo Setting ANTHROPIC_MODEL to !model_value!...
                setx ANTHROPIC_MODEL "!model_value!" >nul
                set "ANTHROPIC_MODEL=!model_value!"
            ) else (
                echo Removing ANTHROPIC_MODEL environment variable...
                setx ANTHROPIC_MODEL= >nul 2>&1
                reg delete "HKCU\Environment" /v ANTHROPIC_MODEL /f >nul 2>&1
                set ANTHROPIC_MODEL=
            )
            set "small_fast_model_value=%%d"
            call :trim small_fast_model_value
            if not "!small_fast_model_value!"=="" (
                setx ANTHROPIC_SMALL_FAST_MODEL "!small_fast_model_value!" >nul
                set "ANTHROPIC_SMALL_FAST_MODEL=!small_fast_model_value!"
            ) else (
                setx ANTHROPIC_SMALL_FAST_MODEL= >nul 2>&1
                reg delete "HKCU\Environment" /v ANTHROPIC_SMALL_FAST_MODEL /f >nul 2>&1
                set ANTHROPIC_SMALL_FAST_MODEL=
            )
            echo Switched to provider: %%a
            pause
            goto start
        )
    )
)



:edit_provider
echo.
echo ========================================
echo           Edit Provider
echo ========================================
if not exist "%CONFIG_FILE%" (
    echo No provider configuration file found
    pause
    goto start
)

:: Display provider list
set count=0
echo Available providers to edit:
for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a count+=1
    if "%%c"=="" (
        if "%%d"=="" (
            echo !count!. %%a
        ) else (
            echo !count!. %%a ^| Small Fast Model: %%d
        )
    ) else (
        if "%%d"=="" (
            echo !count!. %%a ^| Model: %%c
        ) else (
            echo !count!. %%a ^| Model: %%c ^| Small Fast Model: %%d
        )
    )
)

if %count%==0 (
    echo No available provider configurations
    pause
    goto start
)

echo.
echo Enter 'C' to cancel
set /p selection=Select provider to edit ^(1-%count%^) or C to cancel: 

if /i "%selection%"=="C" goto start

:: Check if selection is a valid number
set "valid_number=0"
if %count% gtr 0 (
    for /l %%i in (1,1,%count%) do (
        if "%selection%"=="%%i" set "valid_number=1"
    )
)

if "%valid_number%"=="0" (
    echo Invalid option
    pause
    goto start
)

:: Get the selected provider configuration
set current=0
for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a current+=1
    if !current!==%selection% (
        set "edit_base_url=%%a"
        set "edit_auth_token=%%b"
        set "edit_model=%%c"
        set "edit_small_fast_model=%%d"
        goto edit_provider_input
    )
)

:edit_provider_input
echo.
echo Current configuration:
echo BASE_URL: !edit_base_url!
echo AUTH_TOKEN: !edit_auth_token:~0,20!...
echo MODEL: !edit_model!
echo SMALL_FAST_MODEL: !edit_small_fast_model!
echo.
echo Enter new values (press Enter to keep current value, 'C' to cancel):

set /p new_base_url=Enter new BASE_URL [!edit_base_url!]: 
if /i "!new_base_url!"=="C" goto start
if "!new_base_url!"=="" set "new_base_url=!edit_base_url!"

set /p new_auth_token=Enter new AUTH_TOKEN [!edit_auth_token!]: 
if /i "!new_auth_token!"=="C" goto start
if "!new_auth_token!"=="" set "new_auth_token=!edit_auth_token!"

set /p new_model=Enter new ANTHROPIC_MODEL [!edit_model!]: 
if /i "!new_model!"=="C" goto start
if "!new_model!"=="" set "new_model=!edit_model!"

set /p new_small_fast_model=Enter new ANTHROPIC_SMALL_FAST_MODEL [!edit_small_fast_model!]: 
if /i "!new_small_fast_model!"=="C" goto start
if "!new_small_fast_model!"=="" set "new_small_fast_model=!edit_small_fast_model!"

:: Create temporary file to store updated providers
set "TEMP_FILE=%CONFIG_FILE%.tmp"
if exist "%TEMP_FILE%" del "%TEMP_FILE%"

:: Copy all providers, replacing the selected one
set current=0
for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a current+=1
    if !current!==%selection% (
        echo !new_base_url!^|!new_auth_token!^|!new_model!^|!new_small_fast_model! >> "%TEMP_FILE%"
    ) else (
        echo %%a^|%%b^|%%c^|%%d >> "%TEMP_FILE%"
    )
)

:: Replace original file with temporary file
move "%TEMP_FILE%" "%CONFIG_FILE%" >nul
echo Provider updated successfully!
pause
goto start

:delete_provider
echo.
echo ========================================
echo           Delete Provider
echo ========================================
if not exist "%CONFIG_FILE%" (
    echo No provider configuration file found
    pause
    goto start
)

:: Display provider list
set count=0
echo Available providers to delete:
for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a count+=1
    if "%%c"=="" (
        if "%%d"=="" (
            echo !count!. %%a
        ) else (
            echo !count!. %%a ^| Small Fast Model: %%d
        )
    ) else (
        if "%%d"=="" (
            echo !count!. %%a ^| Model: %%c
        ) else (
            echo !count!. %%a ^| Model: %%c ^| Small Fast Model: %%d
        )
    )
)

if %count%==0 (
    echo No available provider configurations
    pause
    goto start
)

echo.
echo Enter 'C' to cancel
set /p selection=Select provider to delete ^(1-%count%^) or C to cancel: 

if /i "%selection%"=="C" goto start

:: Check if selection is a valid number
set "valid_number=0"
if %count% gtr 0 (
    for /l %%i in (1,1,%count%) do (
        if "%selection%"=="%%i" set "valid_number=1"
    )
)

if "%valid_number%"=="0" (
    echo Invalid option
    pause
    goto start
)

:: Create temporary file to store remaining providers
set "TEMP_FILE=%CONFIG_FILE%.tmp"
if exist "%TEMP_FILE%" del "%TEMP_FILE%"

:: Copy all providers except the selected one
set current=0
for /f "tokens=1,2,3,4 delims=|" %%a in (%CONFIG_FILE%) do (
    set /a current+=1
    if !current! neq %selection% (
        echo %%a^|%%b^|%%c^|%%d >> "%TEMP_FILE%"
    ) else (
        set "deleted_provider=%%a"
    )
)

:: Replace original file with temporary file
if exist "%TEMP_FILE%" (
    move "%TEMP_FILE%" "%CONFIG_FILE%" >nul
    echo Provider deleted successfully: !deleted_provider!
) else (
    echo All providers deleted, removing configuration file
    del "%CONFIG_FILE%"
)

pause
goto start

:unload_provider_silent
setx ANTHROPIC_BASE_URL= >nul 2>&1
setx ANTHROPIC_AUTH_TOKEN= >nul 2>&1
setx ANTHROPIC_MODEL= >nul 2>&1
setx ANTHROPIC_SMALL_FAST_MODEL= >nul 2>&1
reg delete "HKCU\Environment" /v ANTHROPIC_BASE_URL /f >nul 2>&1
reg delete "HKCU\Environment" /v ANTHROPIC_AUTH_TOKEN /f >nul 2>&1
reg delete "HKCU\Environment" /v ANTHROPIC_MODEL /f >nul 2>&1
reg delete "HKCU\Environment" /v ANTHROPIC_SMALL_FAST_MODEL /f >nul 2>&1
set ANTHROPIC_BASE_URL=
set ANTHROPIC_AUTH_TOKEN=
set ANTHROPIC_MODEL=
set ANTHROPIC_SMALL_FAST_MODEL=
goto :eof

:trim
setlocal EnableDelayedExpansion
set "str=!%~1!"
:: Remove leading spaces
for /f "tokens=* delims= " %%a in ("%str%") do set "str=%%a"
:: Remove trailing spaces  
:trim_loop
if "!str:~-1!"==" " (
    set "str=!str:~0,-1!"
    goto trim_loop
)
endlocal & set "%~1=%str%"
goto :eof

:open_new_window
echo Opening Claude Code in new window...
start "" cmd /k "claude"
echo New Claude Code window opened
pause
goto start

:end
echo Starting Claude Code with current provider settings...
claude