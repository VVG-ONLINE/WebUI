import json
import os
import re
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification, Trainer, TrainingArguments
from optimum.onnxruntime import ORTModelForSequenceClassification, ORTQuantizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig

SCRIPT_DIR = Path(__file__).parent
JSONL_PATH = SCRIPT_DIR / 'vikas-dataset-augmented.jsonl'
OUTPUT_DIR = SCRIPT_DIR.parent / 'src' / 'wwwroot' / 'assets' / 'models'
MODEL_DIR = SCRIPT_DIR / 'intent-model'
ONNX_DIR = SCRIPT_DIR / 'intent-model-onnx'

INTENT_KEYWORDS = {
    'digital_transformation': ['digital transformation', 'digital maturity', 'digital strategy', 'digital consulting', 'digital-first', 'digital roadmap', 'digital initiatives', 'digital capability', 'digital change', 'digital culture', 'digital governance', 'cloud adoption', 'cloud value', 'serverless'],
    'design_thinking': ['design thinking', 'workshop', 'empathy', 'user empathy', 'prototyping', 'ideation', 'problem solving'],
    'capability_building': ['capability building', 'capability', 'team skills', 'training', 'learning', 'skill rotation', 'neuroplasticity', 'capability gap', 'capability coverage'],
    'digital_marketing': ['digital marketing', 'marketing', 'seo', 'content marketing', 'social media', 'lead nurturing', 'personalization', 'growth hacking', 'mobile-first', 'voice search', 'a/b testing', 'ecommerce', 'headless commerce', 'martech'],
    'it_management': ['it management', 'infrastructure', 'cybersecurity', 'threat', 'security', 'api', 'data quality', 'analytics', 'iot', 'internet of things'],
    'strategy_innovation': ['strategy', 'innovation', 'strategic', 'competitive', 'portfolio', 'category', 'business case', 'vendor', 'roi', 'kpi', 'metrics', 'change management'],
    'general': ['ai', 'machine learning', 'agile', 'remote', 'ux', 'user experience', 'accessibility', 'crisis', 'storytelling', 'subscription', 'mvp', 'low-code', 'no-code', 'cdn', 'composable']
}

def label_intent(text):
    text_lower = text.lower()
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score > 0:
            scores[intent] = score
    if not scores:
        return 'general'
    return max(scores, key=scores.get)

def load_data():
    texts = []
    labels = []
    with open(JSONL_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                for msg in data.get('messages', []):
                    if msg.get('role') == 'user':
                        content = msg['content']
                        intent = label_intent(content)
                        texts.append(content)
                        labels.append(intent)
            except json.JSONDecodeError:
                continue
    return texts, labels

def prepare_datasets(texts, labels):
    label_encoder = LabelEncoder()
    encoded_labels = label_encoder.fit_transform(labels)
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, encoded_labels, test_size=0.15, random_state=42, stratify=encoded_labels
    )
    label_map = {int(i): label for i, label in enumerate(label_encoder.classes_)}
    with open(OUTPUT_DIR / 'intent-labels.json', 'w') as f:
        json.dump({'labels': label_map, 'num_labels': len(label_map)}, f, indent=2)
    print(f'Classes: {label_encoder.classes_.tolist()}')
    print(f'Train: {len(train_texts)}, Test: {len(test_texts)}')
    return train_texts, test_texts, train_labels, test_labels, label_encoder

class IntentDataset(torch.utils.data.Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
    def __len__(self):
        return len(self.texts)
    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        encoding = self.tokenizer(text, truncation=True, padding='max_length', max_length=self.max_length, return_tensors='pt')
        return {'input_ids': encoding['input_ids'].squeeze(), 'attention_mask': encoding['attention_mask'].squeeze(), 'labels': torch.tensor(label, dtype=torch.long)}

def train_model(train_texts, test_texts, train_labels, test_labels, num_labels):
    model_name = 'distilbert-base-uncased'
    tokenizer = DistilBertTokenizerFast.from_pretrained(model_name)
    train_dataset = IntentDataset(train_texts, train_labels, tokenizer)
    eval_dataset = IntentDataset(test_texts, test_labels, tokenizer)
    model = DistilBertForSequenceClassification.from_pretrained(model_name, num_labels=num_labels, problem_type='single_label_classification')
    training_args = TrainingArguments(output_dir=str(MODEL_DIR), num_train_epochs=5, per_device_train_batch_size=16, per_device_eval_batch_size=16, learning_rate=2e-5, weight_decay=0.01, eval_strategy='epoch', save_strategy='epoch', load_best_model_at_end=True, metric_for_best_model='eval_loss', save_total_limit=1, logging_steps=10, report_to='none')
    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        predictions = np.argmax(logits, axis=-1)
        accuracy = np.mean(predictions == labels)
        return {'accuracy': accuracy}
    trainer = Trainer(model=model, args=training_args, train_dataset=train_dataset, eval_dataset=eval_dataset, compute_metrics=compute_metrics)
    print('Training model...')
    trainer.train()
    model.save_pretrained(MODEL_DIR)
    tokenizer.save_pretrained(MODEL_DIR)
    print(f'Model saved to {MODEL_DIR}')
    return model, tokenizer

def export_to_onnx(tokenizer):
    print('Exporting to ONNX...')
    ort_model = ORTModelForSequenceClassification.from_pretrained(MODEL_DIR, export=True, provider='CPUExecutionProvider')
    ort_model.save_pretrained(ONNX_DIR)
    print('Quantizing to INT8...')
    quantizer = ORTQuantizer.from_pretrained(ONNX_DIR)
    dqconfig = AutoQuantizationConfig.arm64(is_static=False, per_channel=False)
    quantizer.quantize(save_dir=ONNX_DIR / 'quantized', quantization_config=dqconfig)
    quantized_model = ONNX_DIR / 'quantized' / 'model_quantized.onnx'
    if quantized_model.exists():
        output_path = OUTPUT_DIR / 'intent-classifier.onnx'
        output_path.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy(quantized_model, output_path)
        size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f'ONNX model saved to {output_path} ({size_mb:.1f} MB)')
    else:
        fallback = ONNX_DIR / 'model.onnx'
        if fallback.exists():
            output_path = OUTPUT_DIR / 'intent-classifier.onnx'
            output_path.parent.mkdir(parents=True, exist_ok=True)
            import shutil
            shutil.copy(fallback, output_path)
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f'ONNX model (non-quantized) saved to {output_path} ({size_mb:.1f} MB)')

def main():
    print('=' * 60)
    print('Intent Classifier Training Pipeline')
    print('=' * 60)
    texts, labels = load_data()
    print(f'Loaded {len(texts)} samples')
    train_texts, test_texts, train_labels, test_labels, label_encoder = prepare_datasets(texts, labels)
    num_labels = len(label_encoder.classes_)
    model, tokenizer = train_model(train_texts, test_texts, train_labels, test_labels, num_labels)
    export_to_onnx(tokenizer)
    print('=' * 60)
    print('Done! Model ready for Blazor WASM deployment.')
    print('=' * 60)

if __name__ == '__main__':
    main()
