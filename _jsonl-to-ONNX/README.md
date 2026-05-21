# JSONL to ONNX Intent Classifier Conversion

This directory contains the complete process for converting the VVG ONLINE JSONL dataset to a quantized ONNX intent classifier model suitable for Blazor WASM deployment.

## Overview

The process converts a JSONL dataset containing question-answer pairs into a DistilBERT-based intent classifier, exports it to ONNX format, and applies INT8 quantization to minimize model size for web delivery.

## Prerequisites

- Python 3.8+ (tested with 3.12)
- pip package manager
- Internet access for downloading models and datasets

## Step 1: Environment Setup

Create and activate a virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

## Step 2: Install Dependencies

Install the required Python packages:

```bash
pip install torch transformers onnx onnxruntime scikit-learn numpy pandas tqdm
```

## Step 3: Prepare the Dataset

Place your JSONL dataset in this directory as `vikas-dataset-augmented.jsonl` with the following format:

```jsonl
{"messages": [{"role": "user", "content": "What is digital transformation?"}, {"role": "assistant", "content": "Digital transformation is..."}]}
{"messages": [{"role": "user", "content": "How do I improve my SEO?"}, {"role": "assistant", "content": "To improve SEO..."}]}
```

## Step 4: Data Processing and Intent Labeling

The conversion process automatically labels intents based on keyword matching. The 7 intent categories are:

1. `capability_building` - Skills training, team development
2. `design_thinking` - Workshops, problem-solving methodologies  
3. `digital_marketing` - SEO, social media, content marketing
4. `digital_transformation` - Technology adoption, process digitization
5. `general` - General business inquiries
6. `it_management` - Infrastructure, security, IT operations
7. `strategy_innovation` - Strategic planning, innovation initiatives

## Step 5: Conversion Script

Run the complete conversion process:

```bash
python convert_jsonl_to_onnx.py
```

This script performs:
1. JSONL loading and preprocessing
2. Automatic intent labeling using keyword matching
3. Train/test split (80/20)
4. DistilBERT model loading and fine-tuning
5. ONNX export
6. INT8 quantization for size optimization
7. Model validation and testing
8. Saving of model and labels to output directory

## Step 6: Output Files

After successful conversion, you will find:

- `intent-classifier.onnx` - The quantized ONNX model (~64.3MB)
- `intent-labels.json` - Mapping of class indices to intent labels
- `training_metrics.json` - Training accuracy and loss metrics
- `test_results.json` - Evaluation results on test set

## Step 7: Model Validation

To test the converted model:

```bash
python test_model.py
```

This will load the ONNX model and test it with sample inputs to verify correctness.

## Customization Options

### Adjusting Model Size
To further reduce model size, modify the quantization parameters in `convert_jsonl_to_onnx.py`:
- Change quantization mode from `QuantType.QInt8` to `QuantType.QUInt8`
- Adjust optimization level in `CalibrationMethod`

### Changing Base Model
To use a different transformer model, modify the `model_name` variable:
- Currently: `distilbert-base-uncased`
- Alternatives: `bert-base-uncased`, `albert-base-v2`, etc.

### Modifying Intent Categories
Edit the `INTENT_KEYWORDS` dictionary in the conversion script to customize intent labeling logic.

## Technical Details

### Tokenization
The model uses DistilBERT tokenizer with:
- Max sequence length: 128 tokens
- Padding: to max length
- Truncation: for sequences exceeding max length

### Training Configuration
- Epochs: 3
- Batch size: 16
- Learning rate: 2e-5
- Optimizer: AdamW
- Scheduler: Linear with warmup

### Quantization
- Method: Dynamic quantization
- Weight type: INT8
- Activation type: FP32 (preserves accuracy)
- Calibration method: MinMax

## Troubleshooting

### Common Issues

1. **CUDA Out of Memory**: Reduce batch size in training configuration
2. **ONNX Runtime Errors**: Ensure compatible versions of onnx and onnxruntime
3. **Low Accuracy**: Check dataset quality and intent labeling logic
4. **Model Too Large**: Verify quantization was applied correctly

### Performance Expectations
- Training time: 10-30 minutes depending on hardware
- Model size: 60-70MB after INT8 quantization
- Inference speed: <50ms on modern CPUs
- Accuracy: 85-95% depending on dataset quality

## License
This conversion process is provided for use with the VVG ONLINE project. See the main repository for licensing information.

## References
- [DistilBERT Model](https://huggingface.co/distilbert-base-uncased)
- [ONNX Format](https://onnx.ai/)
- [ONNX Runtime Web](https://microsoft.github.io/onnxruntime/)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/index)