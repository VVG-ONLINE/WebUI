/**
 * chat-worker.js — WebWorker for ONNX inference and BM25 search
 * 
 * CONTEXT:
 * This worker runs ONNX model inference and BM25 search off the main thread
 * to avoid blocking the UI. It receives the model buffer from the main thread
 * and performs intent classification and Q&A retrieval.
 * 
 * TOKENIZER:
 * Previously used a character-level fallback tokenizer that produced garbage tokens,
 * causing the model to always predict "general". Now uses the pure-JS WordPiece
 * tokenizer (wordpiece-tokenizer.js) loaded via importScripts().
 */

importScripts('onnxruntime/ort.min.js');
importScripts('wordpiece-tokenizer.js');

ort.env.wasm.wasmPaths = '/assets/js/onnxruntime/';
ort.env.wasm.numThreads = 1;

var session = null;
var labelsData = null;
var tokenizer = null;
var CONFIDENCE_THRESHOLD = 0.5;
var MULTI_INTENT_THRESHOLD = 0.3;
var BM25_K1 = 1.5;
var BM25_B = 0.75;
var BM25_MIN_SCORE = 5.0;
var MAX_LEVENSHTEIN = 2;
var MIN_FUZZY_WORD_LEN = 5;
var MAX_LENGTH = 128;

/**
 * Tokenize text using the WordPiece tokenizer
 * 
 * CONTEXT:
 * This replaces the old character-level fallback tokenizer that produced meaningless
 * token IDs. The WordPiece tokenizer loads vocab from tokenizer-vocab.json and implements
 * the exact algorithm used by HuggingFace transformers during training.
 * 
 * @param {string} text - Input text to tokenize
 * @returns {{ inputIds: number[], attentionMask: number[] }}
 */
function tokenize(text) {
    if (tokenizer) {
        return tokenizer.tokenize(text, MAX_LENGTH);
    }
    
    // Fallback: character-level tokenization (should never happen if vocab loads correctly)
    console.warn('[Worker] WordPiece tokenizer not available, using fallback');
    var words = text.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 0; });
    var inputIds = [101]; // [CLS]
    var attentionMask = [1];

    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        for (var j = 0; j < word.length; j++) {
            var code = word.charCodeAt(j);
            if (code < 1000) {
                inputIds.push(code + 9000);
            } else {
                inputIds.push(code);
            }
            attentionMask.push(1);
        }
        inputIds.push(102); // [SEP]
        attentionMask.push(1);
    }

    while (inputIds.length < MAX_LENGTH) {
        inputIds.push(0); // [PAD]
        attentionMask.push(0);
    }

    if (inputIds.length > MAX_LENGTH) {
        inputIds = inputIds.slice(0, MAX_LENGTH);
        attentionMask = attentionMask.slice(0, MAX_LENGTH);
    }

    return { inputIds: inputIds, attentionMask: attentionMask };
}

function softmax(logits) {
    var maxVal = logits[0];
    for (var i = 1; i < logits.length; i++) {
        if (logits[i] > maxVal) maxVal = logits[i];
    }
    var exps = new Array(logits.length);
    var sum = 0;
    for (var i = 0; i < logits.length; i++) {
        exps[i] = Math.exp(logits[i] - maxVal);
        sum += exps[i];
    }
    for (var i = 0; i < exps.length; i++) {
        exps[i] /= sum;
    }
    return exps;
}

function createInt64Tensor(arr) {
    var bigArr = new BigInt64Array(arr.length);
    for (var i = 0; i < arr.length; i++) {
        bigArr[i] = BigInt(arr[i]);
    }
    return new ort.Tensor('int64', bigArr, [1, arr.length]);
}

async function classifyIntent(question) {
    if (!session || !labelsData) {
        return { intents: [], confidences: [] };
    }

    var tokens = tokenizeFallback(question);
    var inputIdsTensor = createInt64Tensor(tokens.inputIds);
    var attentionMaskTensor = createInt64Tensor(tokens.attentionMask);

    var feeds = {
        input_ids: inputIdsTensor,
        attention_mask: attentionMaskTensor
    };

    var results = await session.run(feeds);
    var logits = results.logits.data;
    var probs = softmax(Array.from(logits));

    var labels = labelsData.labels || labelsData;
    var intents = [];
    var confidences = [];

    var maxProb = 0;
    var maxIdx = 0;
    for (var i = 0; i < probs.length; i++) {
        if (probs[i] > maxProb) {
            maxProb = probs[i];
            maxIdx = i;
        }
    }

    if (maxProb >= CONFIDENCE_THRESHOLD) {
        intents.push(labels[maxIdx]);
        confidences.push(maxProb);
    }

    for (var i = 0; i < probs.length; i++) {
        if (i !== maxIdx && probs[i] >= MULTI_INTENT_THRESHOLD) {
            intents.push(labels[i]);
            confidences.push(probs[i]);
        }
    }

    return { intents: intents, confidences: confidences };
}

function levenshtein(a, b) {
    var matrix = [];
    for (var i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (var j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (var i = 1; i <= b.length; i++) {
        for (var j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function fuzzyMatch(queryWord, targetWord) {
    if (targetWord.length < MIN_FUZZY_WORD_LEN) return false;
    var dist = levenshtein(queryWord, targetWord);
    return dist <= MAX_LEVENSHTEIN && dist > 0;
}

function bm25Score(query, doc, avgDocLen, idf, docTermFreqs, docLen) {
    var score = 0;
    var queryTerms = query.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 0; });
    for (var i = 0; i < queryTerms.length; i++) {
        var term = queryTerms[i];
        var tf = docTermFreqs[term] || 0;
        var idfVal = idf[term] || 0;
        if (tf > 0) {
            var numerator = tf * (BM25_K1 + 1);
            var denominator = tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgDocLen));
            score += idfVal * (numerator / denominator);
        }
    }
    return score;
}

function buildIDF(qaData, queryTerms) {
    var N = qaData.length;
    var df = {};
    for (var i = 0; i < queryTerms.length; i++) {
        df[queryTerms[i]] = 0;
    }
    for (var i = 0; i < qaData.length; i++) {
        var text = (qaData[i].question + ' ' + (qaData[i].answer || '')).toLowerCase();
        var seen = {};
        var words = text.split(/\s+/);
        for (var j = 0; j < words.length; j++) {
            if (!seen[words[j]]) {
                seen[words[j]] = true;
                if (df[words[j]] !== undefined) {
                    df[words[j]]++;
                }
            }
        }
    }
    var idf = {};
    for (var term in df) {
        idf[term] = Math.log((N - df[term] + 0.5) / (df[term] + 0.5) + 1);
    }
    return idf;
}

function getTermFreqs(text) {
    var words = text.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 0; });
    var freqs = {};
    for (var i = 0; i < words.length; i++) {
        freqs[words[i]] = (freqs[words[i]] || 0) + 1;
    }
    return { freqs: freqs, len: words.length };
}

function findRelevantQA(question, intents, qaData) {
    if (!qaData || qaData.length === 0) {
        return { answer: null, score: 0 };
    }

    var filtered = qaData;
    if (intents && intents.length > 0) {
        var intentFiltered = qaData.filter(function (item) {
            var itemIntent = (item.intent || '').toLowerCase();
            for (var i = 0; i < intents.length; i++) {
                if (itemIntent === intents[i].toLowerCase()) return true;
            }
            return false;
        });
        if (intentFiltered.length > 0) {
            filtered = intentFiltered;
        }
    }

    var queryTerms = question.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 0; });
    var idf = buildIDF(filtered, queryTerms);

    var totalLen = 0;
    var docInfos = [];
    for (var i = 0; i < filtered.length; i++) {
        var text = filtered[i].question + ' ' + (filtered[i].answer || '');
        var info = getTermFreqs(text);
        docInfos.push(info);
        totalLen += info.len;
    }
    var avgDocLen = totalLen / filtered.length;

    var bestScore = 0;
    var bestAnswer = null;

    for (var i = 0; i < filtered.length; i++) {
        var score = bm25Score(question, filtered[i].question, avgDocLen, idf, docInfos[i].freqs, docInfos[i].len);

        var queryWords = question.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 0; });
        var docWords = filtered[i].question.toLowerCase().split(/\s+/);
        var fuzzyBonus = 0;
        for (var q = 0; q < queryWords.length; q++) {
            for (var d = 0; d < docWords.length; d++) {
                if (fuzzyMatch(queryWords[q], docWords[d])) {
                    fuzzyBonus += 0.5;
                    break;
                }
            }
        }
        score += fuzzyBonus;

        if (score > bestScore) {
            bestScore = score;
            bestAnswer = filtered[i].answer;
        }
    }

    if (bestScore < BM25_MIN_SCORE) {
        return { answer: null, score: bestScore };
    }

    return { answer: bestAnswer, score: bestScore };
}

self.onmessage = async function (event) {
    var msg = event.data;

    try {
        if (msg.type === 'ping') {
            self.postMessage({ type: 'pong' });
            return;
        }

        if (msg.type === 'init') {
            try {
                console.log('[Worker] Initializing ONNX session...');
                session = await ort.InferenceSession.create(msg.modelBuffer, {
                    executionProviders: ['wasm'],
                    graphOptimizationLevel: 'all'
                });
                labelsData = msg.labelsData;
                console.log('[Worker] ONNX session created successfully');
                
                // Initialize WordPiece tokenizer
                console.log('[Worker] Loading WordPiece tokenizer...');
                tokenizer = new WordPieceTokenizer();
                await tokenizer.loadVocab('/assets/models/tokenizer-vocab.json');
                console.log('[Worker] WordPiece tokenizer loaded');
                
                self.postMessage({ type: 'init-complete', success: true });
            } catch (e) {
                console.log('[Worker] Init failed:', e.message);
                self.postMessage({ type: 'init-complete', success: false, error: e.message });
            }
            return;
        }

        if (msg.type === 'classify') {
            try {
                console.log('[Worker] Classifying:', msg.question);
                var result = await classifyIntent(msg.question);
                self.postMessage({
                    type: 'classify-result',
                    intents: result.intents,
                    confidences: result.confidences
                });
            } catch (e) {
                console.log('[Worker] Classify failed:', e.message);
                self.postMessage({ type: 'classify-result', intents: [], confidences: [] });
            }
            return;
        }

        if (msg.type === 'search') {
            try {
                console.log('[Worker] Searching...');
                var result = findRelevantQA(msg.question, msg.intents, msg.qaData);
                self.postMessage({
                    type: 'search-result',
                    answer: result.answer,
                    score: result.score
                });
            } catch (e) {
                console.log('[Worker] Search failed:', e.message);
                self.postMessage({ type: 'search-result', answer: null, score: 0 });
            }
            return;
        }

    } catch (e) {
        console.log('[Worker] Unhandled error:', e.message);
        self.postMessage({ type: 'error', error: e.message });
    }
};
