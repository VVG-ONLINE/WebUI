@echo off
echo ========================================
echo JSONL to ONNX Conversion - Windows Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python found!
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To convert your JSONl dataset to ONNX:
echo   1. Place your dataset as 'vikas-dataset-augmented.jsonl' in this folder
echo   2. Run: python convert_jsonl_to_onnx.py
echo.
echo To test the converted model:
echo   Run: python test_model.py
echo.
pause