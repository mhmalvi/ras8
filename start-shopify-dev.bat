@echo off
echo Starting Shopify Partner Platform Development Environment...
echo.

REM Kill any existing ngrok processes
echo Stopping existing ngrok tunnels...
taskkill /F /IM ngrok.exe 2>nul

REM Start ngrok tunnel in background
echo Starting ngrok tunnel...
start /B "" ngrok.exe start shopify-app --config=ngrok.yml

REM Wait for ngrok to start
echo Waiting for ngrok to initialize...
timeout /t 5 /nobreak >nul

REM Get tunnel URL
echo Getting tunnel URL...
for /f "tokens=*" %%i in ('powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 5; $response.tunnels[0].public_url } catch { 'ERROR' }"') do set TUNNEL_URL=%%i

if "%TUNNEL_URL%"=="ERROR" (
    echo Failed to get tunnel URL. Please check ngrok configuration.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo   Shopify Partner Platform Configuration
echo ===============================================
echo.
echo Your ngrok tunnel is running at:
echo %TUNNEL_URL%
echo.
echo Update your Shopify Partner Platform URLs to:
echo - App URL: %TUNNEL_URL%/
echo - Preferences URL: %TUNNEL_URL%/preferences
echo - Allowed redirection URLs:
echo   * %TUNNEL_URL%/auth/callback
echo   * %TUNNEL_URL%/auth/shopify/callback
echo   * %TUNNEL_URL%/auth/inline
echo   * %TUNNEL_URL%/dashboard
echo   * %TUNNEL_URL%/
echo.
echo Webhook endpoints:
echo - %TUNNEL_URL%/functions/v1/shopify-webhook
echo - %TUNNEL_URL%/functions/v1/shopify-gdpr-webhooks
echo.
echo ===============================================
echo.

REM Start the development server
echo Starting development server...
npm run dev