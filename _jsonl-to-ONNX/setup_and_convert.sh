#!/bin/bash

echo "========================================"
echo "JSONL to ONNX Conversion - Unix Setup"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed or not in PATH"
    echo "Please install Python 3.8+ using your package manager"
    exit 1
fi

echo "Python found: $(python3 --version)"
echo

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

echo
echo "Activating virtual environment..."
source venv/bin/activate

echo
echo "Installing dependencies..."
pip install -r requirements.txt

echo
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo
echo "To convert your JSONL dataset to ONNX:"
echo "  1. Place your dataset as 'vikas-dataset-augmented.jsonl' in this folder"
echo "  2. Run: python convert_jsonl_to_onnx.py"
echo
echo "To test the converted model:"
echo "  Run: python test_model.py"
echo