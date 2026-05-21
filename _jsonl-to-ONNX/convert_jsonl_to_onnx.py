#!/usr/bin/env python3
"""
JSONL to ONNX Intent Classifier Conversion Script
Converts VVG ONLINE JSONL dataset to quantized ONNX model for Blazor WASM
"""

import json
import os
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType
import onnxruntime as ort
from tqdm.auto import tqdm
import pandas as pd

# Configuration
MODEL_NAME = "distilbert-base-uncased"
MAX_LENGTH = 128
BATCH_SIZE = 16
EPOCHS = 3
LEARNING_RATE = 2e-5
OUTPUT_DIR = "./model_output"
TEST_SIZE = 0.2
RANDOM_SEED = 42

# Intent categories with keyword mapping for automatic labeling
INTENT_KEYWORDS = {
    "capability_building": [
        "skill", "training", "development", "learn", "education", "capability", 
        "competency", "upskill", "reskilling", "workforce", "talent", "knowledge"
    ],
    "design_thinking": [
        "design", "thinking", "workshop", "innovation", "creative", "problem-solving",
        "empathy", "ideation", "prototype", "testing", "human-centered"
    ],
    "digital_marketing": [
        "marketing", "digital", "seo", "social", "media", "content", "campaign",
        "advertising", "brand", "analytics", "lead", "conversion", "engagement"
    ],
    "digital_transformation": [
        "transformation", "digital", "technology", "automation", "process", "modernization",
        "legacy", "migration", "cloud", "data", "analytics", "ai", "iot"
    ],
    "general": [
        "hello", "hi", "help", "information", "about", "what", "how", "why", 
        "who", "when", "where", "explain", "tell", "describe"
    ],
    "it_management": [
        "it", "information", "technology", "infrastructure", "network", "security",
        "system", "software", "hardware", "support", "maintenance", "cloud", "server"
    ],
    "strategy_innovation": [
        "strategy", "strategic", "innovation", "planning", "roadmap", "vision",
        "mission", "goal", "objective", "growth", "competitive", "market", "business"
    ]
}

def set_seed(seed):
    """Set random seed for reproducibility"""
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

class JSONLDataset(Dataset):
    """Dataset class for JSONL format data"""
    
    def __init__(self, texts, labels, tokenizer, max_length):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        
        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt',
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def load_and_label_jsonl(filepath):
    """Load JSONL file and automatically label intents based on keyword matching"""
    print("Loading JSONL dataset...")
    
    texts = []
    labels = []
    label_to_intent = {}
    intent_to_label = {}
    
    # Create intent to label mapping
    for i, intent in enumerate(INTENT_KEYWORDS.keys()):
        intent_to_label[intent] = i
        label_to_intent[i] = intent
    
    # Load JSONL data
    with open(filepath, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            try:
                data = json.loads(line.strip())
                if 'messages' in data and len(data['messages']) >= 2:
                    # Extract user message (first message)
                    user_msg = None
                    for msg in data['messages']:
                        if msg.get('role') == 'user':
                            user_msg = msg.get('content', '').strip()
                            break
                    
                    if user_msg:
                        texts.append(user_msg)
                        
                        # Auto-label based on keyword matching
                        intent_scores = {}
                        lower_msg = user_msg.lower()
                        
                        for intent, keywords in INTENT_KEYWORDS.items():
                            score = sum(1 for keyword in keywords if keyword in lower_msg)
                            intent_scores[intent] = score
                        
                        # Assign intent with highest score, default to 'general'
                        if intent_scores:
                            best_intent = max(intent_scores, key=intent_scores.get)
                            # If no keywords matched, default to general
                            if intent_scores[best_intent] == 0:
                                best_intent = "general"
                        else:
                            best_intent = "general"
                            
                        labels.append(intent_to_label[best_intent])
                        
            except json.JSONDecodeError as e:
                print(f"Warning: Skipping invalid JSON on line {line_num}: {e}")
                continue
            except Exception as e:
                print(f"Warning: Error processing line {line_num}: {e}")
                continue
    
    print(f"Loaded {len(texts)} samples")
    print("Intent distribution:")
    unique, counts = np.unique(labels, return_counts=True)
    for label_idx, count in zip(unique, counts):
        intent = label_to_intent[label_idx]
        print(f"  {intent}: {count} ({count/len(labels)*100:.1f}%)")
    
    return texts, labels, label_to_intent, intent_to_label

def compute_metrics(pred):
    """Compute metrics for evaluation"""
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    acc = accuracy_score(labels, preds)
    return {
        'accuracy': acc,
    }

def main():
    """Main conversion function"""
    print("=" * 60)
    print("JSONL to ONNX Intent Classifier Conversion")
    print("=" * 60)
    
    # Set seed for reproducibility
    set_seed(RANDOM_SEED)
    
    # Check if dataset exists
    dataset_path = "vikas-dataset-augmented.jsonl"
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset file '{dataset_path}' not found!")
        print("Please place your JSONL dataset in this directory.")
        return
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load and label dataset
    texts, labels, label_to_intent, intent_to_label = load_and_label_jsonl(dataset_path)
    
    if len(texts) == 0:
        print("Error: No valid data found in dataset!")
        return
    
    # Split dataset
    print(f"\nSplitting dataset (train: {1-TEST_SIZE:.0%}, test: {TEST_SIZE:.0%})...")
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, labels, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=labels
    )
    
    # Load tokenizer and model
    print(f"\nLoading {MODEL_NAME} tokenizer and model...")
    tokenizer = DistilBertTokenizer.from_pretrained(MODEL_NAME)
    model = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME, 
        num_labels=len(INTENT_KEYWORDS)
    )
    
    # Create datasets
    train_dataset = JSONLDataset(train_texts, train_labels, tokenizer, MAX_LENGTH)
    test_dataset = JSONLDataset(test_texts, test_labels, tokenizer, MAX_LENGTH)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir=f'{OUTPUT_DIR}/logs',
        logging_steps=100,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
        greater_is_better=True,
        save_total_limit=2,
        dataloader_pin_memory=False,
    )
    
    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        compute_metrics=compute_metrics,
    )
    
    # Train model
    print(f"\nStarting training for {EPOCHS} epochs...")
    trainer.train()
    
    # Evaluate model
    print("\nEvaluating model on test set...")
    eval_results = trainer.evaluate()
    print(f"Test Accuracy: {eval_results['eval_accuracy']:.4f}")
    
    # Get predictions for detailed report
    predictions = trainer.predict(test_dataset)
    y_pred = np.argmax(predictions.predictions, axis=1)
    
    # Classification report
    target_names = [label_to_intent[i] for i in sorted(label_to_intent.keys())]
    report = classification_report(test_labels, y_pred, target_names=target_names, output_dict=True)
    print("\nDetailed Classification Report:")
    for intent in target_names:
        print(f"  {intent}:")
        print(f"    Precision: {report[intent]['precision']:.3f}")
        print(f"    Recall: {report[intent]['recall']:.3f}")
        print(f"    F1-Score: {report[intent]['f1-score']:.3f}")
    
    # Save label mapping
    labels_path = os.path.join(OUTPUT_DIR, "intent-labels.json")
    with open(labels_path, 'w') as f:
        json.dump(label_to_intent, f, indent=2)
    print(f"\nSaved intent labels to {labels_path}")
    
    # Save model
    model_save_path = os.path.join(OUTPUT_DIR, "pytorch_model")
    trainer.save_model(model_save_path)
    tokenizer.save_pretrained(model_save_path)
    print(f"Saved PyTorch model to {model_save_path}")
    
    # Export to ONNX
    print("\nExporting model to ONNX format...")
    model.eval()
    
    # Create dummy input for tracing
    dummy_input = tokenizer.encode_plus(
        "This is a test sentence for model tracing.",
        add_special_tokens=True,
        max_length=MAX_LENGTH,
        padding='max_length',
        truncation=True,
        return_tensors='pt',
    )
    
    input_ids = dummy_input["input_ids"]
    attention_mask = dummy_input["attention_mask"]
    
    # Define output paths
    onnx_path = os.path.join(OUTPUT_DIR, "intent-classifier.onnx")
    quantized_onnx_path = os.path.join(OUTPUT_DIR, "intent-classifier-quantized.onnx")
    
    # Export to ONNX
    torch.onnx.export(
        model,  # model being run
        (input_ids, attention_mask),  # model input
        onnx_path,  # where to save the model
        export_params=True,  # store the trained parameter weights inside the model file
        opset_version=14,  # the ONNX version to export the model to
        do_constant_folding=True,  # whether to execute constant folding for optimization
        input_names=['input_ids', 'attention_mask'],  # the model's input names
        output_names=['logits'],  # the model's output names
        dynamic_axes={
            'input_ids': {0: 'batch_size', 1: 'sequence'},  # variable length axes
            'attention_mask': {0: 'batch_size', 1: 'sequence'},
            'logits': {0: 'batch_size'}  # variable batch size
        }
    )
    print(f"Exported ONNX model to {onnx_path}")
    
    # Quantize the ONNX model
    print("Applying INT8 quantization...")
    quantize_dynamic(
        model_input=onnx_path,
        model_output=quantized_onnx_path,
        weight_type=QuantType.QInt8,
        optimize_model=True,
        per_channel=False,
        reduce_range=False,
        weight_quant_type=QuantType.QInt8,
        activation_type=QuantType.QInt8,
    )
    print(f"Saved quantized ONNX model to {quantized_onnx_path}")
    
    # Validate quantized model
    print("\nValidating quantized model...")
    try:
        # Load original ONNX model
        ort_session_original = ort.InferenceSession(onnx_path)
        # Load quantized ONNX model
        ort_session_quantized = ort.InferenceSession(quantized_onnx_path)
        
        # Test with sample input
        test_texts = ["What is digital transformation?", "How to improve team skills?"]
        test_encodings = tokenizer(
            test_texts,
            padding=True,
            truncation=True,
            max_length=MAX_LENGTH,
            return_tensors="np"
        )
        
        ort_inputs = {
            'input_ids': test_encodings['input_ids'].astype(np.int64),
            'attention_mask': test_encodings['attention_mask'].astype(np.int64)
        }
        
        # Get predictions from both models
        original_logits = ort_session_original.run(None, ort_inputs)[0]
        quantized_logits = ort_session_quantized.run(None, ort_inputs)[0]
        
        # Compare predictions
        original_preds = np.argmax(original_logits, axis=1)
        quantized_preds = np.argmax(quantized_logits, axis=1)
        
        if np.array_equal(original_preds, quantized_preds):
            print("✓ Quantized model validation PASSED - predictions match")
        else:
            print("⚠ Quantized model validation WARNING - predictions differ")
            print(f"  Original: {original_preds}")
            print(f"  Quantized: {quantized_preds}")
        
        # Check file sizes
        original_size = os.path.getsize(onnx_path) / (1024 * 1024)  # MB
        quantized_size = os.path.getsize(quantized_onnx_path) / (1024 * 1024)  # MB
        compression_ratio = original_size / quantized_size if quantized_size > 0 else 0
        
        print(f"\nModel Size Comparison:")
        print(f"  Original ONNX: {original_size:.2f} MB")
        print(f"  Quantized ONNX: {quantized_size:.2f} MB")
        print(f"  Compression Ratio: {compression_ratio:.2f}x")
        
        # Save the quantized model as the final output (overwrite the original ONNX path)
        if os.path.exists(onnx_path):
            os.remove(onnx_path)
        os.rename(quantized_onnx_path, onnx_path)
        print(f"✓ Final model saved as {onnx_path}")
        
    except Exception as e:
        print(f"Warning: Model validation failed: {e}")
        print("Using unquantized model as fallback...")
        # Keep the original ONNX model if quantization fails
        if os.path.exists(quantized_onnx_path):
            os.remove(quantized_onnx_path)
    
    # Save training metrics
    metrics_path = os.path.join(OUTPUT_DIR, "training_metrics.json")
    with open(metrics_path, 'w') as f:
        json.dump({
            'test_accuracy': float(eval_results['eval_accuracy']),
            'epochs': EPOCHS,
            'batch_size': BATCH_SIZE,
            'learning_rate': LEARNING_RATE,
            'model_name': MODEL_NAME,
            'max_length': MAX_LENGTH,
            'num_intents': len(INTENT_KEYWORDS),
            'intent_labels': label_to_intent,
            'train_samples': len(train_texts),
            'test_samples': len(test_texts)
        }, f, indent=2)
    print(f"Saved training metrics to {metrics_path}")
    
    # Final summary
    print("\n" + "=" * 60)
    print("CONVERSION COMPLETE")
    print("=" * 60)
    print(f"✓ Dataset processed: {len(texts)} samples")
    print(f"✓ Intent categories: {len(INTENT_KEYWORDS)}")
    print(f"✓ Test accuracy: {eval_results['eval_accuracy']:.2%}")
    print(f"✓ Final model: {onnx_path}")
    print(f"✓ Label mapping: {labels_path}")
    print(f"✓ Training metrics: {metrics_path}")
    print("\nNext steps:")
    print(f"1. Copy '{os.path.basename(onnx_path)}' to src/wwwroot/assets/models/")
    print(f"2. Copy 'intent-labels.json' to src/wwwroot/assets/models/")
    print(f"3. Keep original JSONL as backup in src/wwwroot/assets/data/")
    print("=" * 60)

if __name__ == "__main__":
    main()