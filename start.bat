@echo off
echo ========================================
echo Dayal Trading LLC - Luxury Watch Store
echo ========================================
echo.
echo Installing dependencies...
cd backend
call npm install
echo.
echo Starting server...
echo.
echo Server will be available at: http://localhost:3000
echo.
echo Admin Login:
echo Username: admin
echo Password: admin123
echo.
call npm start
