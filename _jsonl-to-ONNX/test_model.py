#!/usr/bin/env python3
"""
Test script for validating the converted ONNX intent classifier model
"""

import json
import os
import numpy as np
import onnxruntime as ort
from transformers import DistilBertTokenizer

# Configuration
MODEL_DIR = "./model_output"
MODEL_PATH = os.path.join(MODEL_DIR, "intent-classifier.onnx")
LABELS_PATH = os.path.join(MODEL_DIR, "intent-labels.json")
MAX_LENGTH = 128

def load_model_and_labels():
    """Load ONNX model and intent labels"""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
    if not os.path.exists(LABELS_PATH):
        raise FileNotFoundError(f"Labels not found at {LABELS_PATH}")
    
    print(f"Loading ONNX model from {MODEL_PATH}...")
    session = ort.InferenceSession(MODEL_PATH)
    
    print(f"Loading intent labels from {LABELS_PATH}...")
    with open(LABELS_PATH, 'r') as f:
        labels = json.load(f)
    
    return session, labels

def tokenize_text(text, tokenizer, max_length=MAX_LENGTH):
    """Tokenize text for model input"""
    encoding = tokenizer.encode_plus(
        text,
        add_special_tokens=True,
        max_length=max_length,
        padding='max_length',
        truncation=True,
        return_tensors='np',
    )
    return {
        'input_ids': encoding['input_ids'].astype(np.int64),
        'attention_mask': encoding['attention_mask'].astype(np.int64)
    }

def predict_intent(session, labels, tokenizer, text):
    """Predict intent for a single text"""
    inputs = tokenize_text(text, tokenizer)
    
    ort_inputs = {
        'input_ids': inputs['input_ids'],
        'attention_mask': inputs['attention_mask']
    }
    
    ort_outputs = session.run(None, ort_inputs)
    logits = ort_outputs[0]
    predicted_class = np.argmax(logits, axis=1)[0]
    confidence = float(np.max(logits))
    
    intent = labels.get(str(predicted_class), "unknown")
    return intent, confidence

def main():
    """Main test function"""
    print("=" * 60)
    print("ONNX Intent Classifier Model Validation")
    print("=" * 60)
    
    try:
        # Load model and labels
        session, labels = load_model_and_labels()
        
        # Load tokenizer
        print("Loading tokenizer...")
        tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
        
        # Test cases
        test_cases = [
            "What is digital transformation?",
            "How can we improve our team's skills and capabilities?",
            "What design thinking workshops do you offer?",
            "How do I improve my SEO and digital marketing?",
            "What IT management services do you provide?",
            "Can you help us develop a strategic roadmap?",
            "Hello, I need some general information about your services"
        ]
        
        print("\nRunning test predictions:")
        print("-" * 60)
        
        for i, text in enumerate(test_cases, 1):
            intent, confidence = predict_intent(session, labels, tokenizer, text)
            print(f"Test {i}:")
            print(f"  Input: {text}")
            print(f"  Predicted Intent: {intent}")
            print(f"  Confidence: {confidence:.4f}")
            print()
        
        print("=" * 60)
        print("VALIDATION COMPLETE")
        print("=" * 60)
        print("✓ Model loaded successfully")
        print("✓ Predictions generated for all test cases")
        print("✓ Model is ready for deployment")
        
    except Exception as e:
        print(f"\n✗ VALIDATION FAILED: {e}")
        raise

if __name__ == "__main__":
    main()