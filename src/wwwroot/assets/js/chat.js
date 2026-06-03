console.log('[CHAT.JS] Version 3 loaded - correctIntent active');
/**
 * chat.js — ONNX Intent Classifier + JSONL Q&A Retrieval
 *
 * This is the AI chatbot engine for VVG ONLINE ("Vikas AI"). It runs
 * entirely in the user's browser — no server required for inference.
 *
 * Architecture (two-tier fallback):
 *
 *   Tier 1 (ONNX): Downloads a DistilBERT intent classifier (~64MB, ONNX format),
 *                  tokenises the user's question via WordPiece (@xenova/transformers),
 *                  runs inference to classify the intent category, then searches a
 *                  JSONL Q&A dataset using BM25 scoring for the best matching answer.
 *
 *   Tier 2 (JSONL only): If the ONNX model fails to download or load,
 *                        falls back to keyword-matching against the same
 *                        JSONL dataset without intent classification.
 *
 * Performance features:
 *   - IndexedDB caching via ModelCache (model + dataset cached across sessions)
 *   - Progressive download with fetch ReadableStream (shows % progress)
 *   - WebWorker offloading (ONNX inference + BM25 search off main thread)
 *
 * Data flow:
 *   C# (MainLayout.razor.cs) → JS (chat.js) → WebWorker (chat-worker.js) → ONNX Runtime Web
 *
 * The C# side calls:
 *   - transformersChat.init(dotNetHelper)  — start model download
 *   - transformersChat.generate(messages)   — get answer for user input
 *
 * And chat.js calls back into C# via the dotNetHelper:
 *   - UpdateProgress(message)             — show loading status in terminal
 *   - OnModelReady()                       — signal that model is loaded
 *   - OnSystemPromptReady(prompt)          — system prompt is ready
 */

window.transformersChat = {
    session: null,
    tokenizer: null,
    dotnetHelper: null,
    qaData: [],
    intentLabels: null,
    modelLoaded: false,
    transformersLoaded: false,
    useFallbackTokenizer: false,
    bm25Index: null,

    worker: null,
    workerReady: false,
    _workerCallbacks: {},
    _workerMsgId: 0,

    cacheReady: false,
    MODEL_CACHE_KEY: 'intent-classifier-v1',
    DATASET_CACHE_KEY: 'vikas-dataset-v1',

    recentResponses: [],
    MAX_RECENT_RESPONSES: 5,

    CONFIDENCE_THRESHOLD: 0.5,
    MULTI_INTENT_THRESHOLD: 0.3,
    BM25_K1: 1.5,
    BM25_B: 0.75,
    BM25_MIN_SCORE: 5.0,
    FUZZY_MAX_DISTANCE: 2,
    FUZZY_MIN_WORD_LENGTH: 5,

    STOPWORDS: new Set([
        'how', 'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might',
        'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why',
        'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
        'a', 'an', 'the', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
        'my', 'your', 'his', 'its', 'our', 'their',
        'and', 'but', 'or', 'nor', 'not', 'so', 'yet',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
        'about', 'between', 'through', 'during', 'before', 'after', 'above', 'below',
        'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
        'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
        'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
        'just', 'because', 'if', 'while', 'although', 'though', 'unless', 'until'
    ]),

    INTENT_KEYWORDS: {
        digital_transformation: [
            'digital transformation', 'digital maturity', 'digital strategy',
            'digital consulting', 'digital-first', 'digital roadmap', 'digital initiatives',
            'digital capability', 'digital change', 'digital culture', 'digital governance',
            'cloud adoption', 'cloud value', 'serverless', 'serverless architecture', 'legacy systems',
            'modernize', 'digitalize', 'digital maturity'
        ],
        design_thinking: [
            'design thinking', 'workshop', 'empathy', 'user empathy',
            'prototyping', 'ideation', 'problem solving', 'problem-solving',
            'human-centered', 'user experience', 'ux', 'accessibility',
            'wireframe', 'journey map', 'design workshop'
        ],
        capability_building: [
            'capability building', 'capability', 'team skills', 'training',
            'learning', 'skill rotation', 'neuroplasticity', 'capability gap',
            'capability coverage', 'upskill', 'workforce', 'competency',
            'low-code', 'no-code', 'team capabilities', 'build team'
        ],
        digital_marketing: [
            'digital marketing', 'marketing', 'seo', 'content marketing',
            'social media', 'lead nurturing', 'personalization', 'growth hacking',
            'mobile-first', 'voice search', 'a/b testing', 'ab testing', 'ecommerce',
            'headless commerce', 'martech', 'conversion optimization', 'ppc',
            'email marketing', 'influencer', 'conversion rate', 'bounce rate'
        ],
        it_management: [
            'it management', 'infrastructure', 'cybersecurity', 'cyber',
            'threat', 'security', 'api', 'data quality', 'data quality management',
            'internet of things', 'agile', 'cdn', 'firewall', 'backup',
            'disaster recovery', 'governance', 'compliance', 'zero trust',
            'cyber threats', 'iot implementation', 'iot implementation', 'api management'
        ],
        strategy_innovation: [
            'strategy', 'innovation', 'strategic', 'competitive', 'portfolio',
            'category', 'business case', 'vendor', 'roi', 'kpi', 'kpis',
            'metrics', 'kpi tracking', 'kpi dashboard', 'kpi setting', 'kpis tracking',
            'kpi tracking', 'kpi metrics', 'kpi monitoring', 'key performance indicators',
            'kpi should we track', 'kpis should we track',
            'change management', 'competitive advantage',
            'business model', 'value proposition'
        ],
        general: [
            'hello', 'hi', 'hey', 'thanks', 'bye', 'goodbye',
            'contact', 'location', 'hours', 'pricing', 'cost', 'quote',
            'mvp', 'composable'
        ]
    },

    async init(dotnetHelper) {
        this.dotnetHelper = dotnetHelper;

        try {
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Initializing cache...');
            if (typeof window.ModelCache !== 'undefined') {
                this.cacheReady = await window.ModelCache.init();
                console.log('[AI] IndexedDB cache:', this.cacheReady ? 'ready' : 'unavailable');
            }

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading AI libraries...');
            await this.loadOnnxRuntime();
            await this.loadTransformers();

            await this._initWorker();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading Q&A dataset...');
            await this.loadQaData();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading intent classifier (~64MB)...');
            await this.loadModel();

            if (this.modelLoaded) {
                const mode = this.workerReady ? 'WebWorker' : 'main-thread';
                const tok = this.useFallbackTokenizer ? 'fallback' : 'WordPiece';
                console.log(`[AI] Ready: ONNX + JSONL mode (${mode}, tokenizer: ${tok})`);
                await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI model ready');
                await this.dotnetHelper.invokeMethodAsync('OnChatOnline');
            } else {
                console.log('[AI] Ready: JSONL back-up mode only');
                await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI ready (limited mode)');
            }

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', '');
            await this.dotnetHelper.invokeMethodAsync('OnModelReady');

        } catch (error) {
            console.error('[AI] INIT ERROR:', error);
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', '');
            await this.dotnetHelper.invokeMethodAsync('OnModelReady');
            await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI ready (limited mode)');
        }
    },

    async _initWorker() {
        try {
            if (typeof Worker === 'undefined') {
                console.log('[AI] WebWorkers not supported');
                return;
            }

            this.worker = new Worker('assets/js/chat-worker.js');
            this.worker.onmessage = (e) => this._handleWorkerMessage(e.data);
            this.worker.onerror = (e) => {
                console.warn('[AI] Worker error:', e.message);
                this.workerReady = false;
            };

            const pong = await this._workerCall('ping', null, 3000);
            if (pong && pong.type === 'pong') {
                this.workerReady = true;
                console.log('[AI] WebWorker initialized');
            }
        } catch (e) {
            console.warn('[AI] WebWorker init failed:', e.message);
            this.workerReady = false;
            this.worker = null;
        }
    },

    _handleWorkerMessage(msg) {
        const cb = this._workerCallbacks[msg._id];
        if (cb) {
            delete this._workerCallbacks[msg._id];
            cb.resolve(msg);
        }
    },

    _workerCall(type, data, timeout = 30000) {
        if (!this.worker || !this.workerReady) {
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            const id = ++this._workerMsgId;
            const timer = setTimeout(() => {
                delete this._workerCallbacks[id];
                reject(new Error(`Worker timeout: ${type}`));
            }, timeout);

            this._workerCallbacks[id] = {
                resolve: (msg) => { clearTimeout(timer); resolve(msg); },
                reject: (err) => { clearTimeout(timer); reject(err); }
            };

            this.worker.postMessage({ ...data, type, _id: id });
        });
    },

    async loadOnnxRuntime() {
        if (typeof ort === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.min.js';
                script.onload = () => {
                    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';
                    ort.env.wasm.numThreads = 1;
                    console.log('[AI] ONNX Runtime loaded');
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load ONNX Runtime'));
                document.head.appendChild(script);
            });
        }
    },

    /**
     * Load the pure-JS WordPiece tokenizer
     * 
     * CONTEXT:
     * Previously tried to use @xenova/transformers, but it's an ES module that doesn't
     * work as a regular <script> tag. This caused the tokenizer to fail silently and
     * fall back to garbage character-level tokens, making the model predict "general"
     * for everything.
     * 
     * Now uses wordpiece-tokenizer.js which:
     * - Loads tokenizer-vocab.json (exported by training script)
     * - Implements exact WordPiece algorithm from HuggingFace
     * - Works as regular <script> tag with zero dependencies
     */
    async loadTransformers() {
        // Check if WordPiece tokenizer is available
        if (typeof window.WordPieceTokenizer === 'undefined') {
            console.error('[AI] WordPieceTokenizer not loaded. Check that wordpiece-tokenizer.js is included.');
            this.transformersLoaded = false;
            return;
        }

        try {
            // Initialize the tokenizer
            this.tokenizer = new window.WordPieceTokenizer();
            
            // Load the vocabulary from the training output
            await this.tokenizer.loadVocab('assets/models/tokenizer-vocab.json');
            
            this.transformersLoaded = true;
            this.useFallbackTokenizer = false;
            console.log('[AI] WordPiece tokenizer loaded successfully');
            
        } catch (error) {
            console.error('[AI] WordPiece tokenizer failed to load:', error.message);
            console.warn('[AI] Will use fallback character-level tokenizer (accuracy will be severely degraded)');
            this.transformersLoaded = false;
            this.useFallbackTokenizer = true;
        }
    },

    async _fetchWithProgress(url, onProgress) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;

        if (!response.body || !response.body.getReader) {
            const buffer = await response.arrayBuffer();
            if (onProgress) onProgress(buffer.byteLength, total);
            return buffer;
        }

        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            received += value.length;
            if (onProgress) onProgress(received, total);
        }

        const buffer = new ArrayBuffer(received);
        const view = new Uint8Array(buffer);
        let offset = 0;
        for (const chunk of chunks) {
            view.set(chunk, offset);
            offset += chunk.length;
        }

        return buffer;
    },

    _formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },

    async loadModel() {
        try {
            const modelUrl = 'assets/models/intent-classifier.onnx';
            const labelsUrl = 'assets/models/intent-labels.json';

            let modelBuffer = null;

            if (this.cacheReady) {
                modelBuffer = await window.ModelCache.get(this.MODEL_CACHE_KEY);
                if (modelBuffer) {
                    console.log(`[AI] Model loaded from cache (${this._formatBytes(modelBuffer.byteLength)})`);
                    await this.dotnetHelper.invokeMethodAsync('UpdateProgress',
                        `Model loaded from cache (${this._formatBytes(modelBuffer.byteLength)})`);
                }
            }

            if (!modelBuffer) {
                let lastPct = -1;
                modelBuffer = await this._fetchWithProgress(modelUrl, (received, total) => {
                    if (total > 0) {
                        const pct = Math.round((received / total) * 100);
                        if (pct !== lastPct && pct % 5 === 0) {
                            lastPct = pct;
                            this.dotnetHelper.invokeMethodAsync('UpdateProgress',
                                `Downloading model: ${pct}% (${this._formatBytes(received)}/${this._formatBytes(total)})`);
                        }
                    } else {
                        this.dotnetHelper.invokeMethodAsync('UpdateProgress',
                            `Downloading model: ${this._formatBytes(received)}`);
                    }
                });

                if (this.cacheReady) {
                    await window.ModelCache.set(this.MODEL_CACHE_KEY, modelBuffer);
                    console.log('[AI] Model saved to cache');
                }
            }

            const labelsRes = await fetch(labelsUrl).then(r => r.json());
            this.intentLabels = labelsRes.labels || labelsRes;
            console.log('[AI] Intent labels loaded:', Object.values(this.intentLabels));

            await this._loadModelLocally(modelBuffer);

            if (this.workerReady) {
                try {
                    const bufferCopy = modelBuffer.slice(0);
                    const initResult = await this._workerCall('init', {
                        modelBuffer: bufferCopy,
                        labelsData: labelsRes
                    }, 60000);

                    if (initResult && initResult.success) {
                        console.log('[AI] Model also initialized in WebWorker (for BM25 search)');
                    } else {
                        console.warn('[AI] Worker model init failed, BM25 will run on main thread');
                        this.workerReady = false;
                    }
                } catch (e) {
                    console.warn('[AI] Worker init error:', e.message);
                    this.workerReady = false;
                }
            }

            // Tokenizer is now loaded in loadTransformers(), no additional initialization needed
            if (this.modelLoaded && !this.transformersLoaded) {
                console.warn('[AI] WordPiece tokenizer not available, using fallback (accuracy will be severely degraded)');
                this.useFallbackTokenizer = true;
                this.tokenizer = null;
            }

        } catch (error) {
            console.warn('[AI] ONNX model failed to load, using back-up mode');
            console.warn('[AI] Error details:', error.message);
            this.session = null;
            this.modelLoaded = false;
        }
    },

    async _loadModelLocally(modelBuffer) {
        try {
            this.session = await ort.InferenceSession.create(modelBuffer, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all',
                enableMemPattern: true,
                enableCpuMemArena: true
            });
            this.modelLoaded = true;
            console.log('[AI] ONNX session created on main thread');
        } catch (e) {
            console.warn('[AI] Local model load failed:', e.message);
            this.modelLoaded = false;
        }
    },

    async loadQaData() {
        let text = null;

        if (this.cacheReady) {
            const cached = await window.ModelCache.get(this.DATASET_CACHE_KEY);
            if (cached) {
                text = new TextDecoder().decode(cached);
                console.log(`[AI] Dataset loaded from cache (${this._formatBytes(cached.byteLength)})`);
            }
        }

        if (!text) {
            const res = await fetch('assets/data/vikas-dataset-augmented.jsonl');
            text = await res.text();

            if (this.cacheReady) {
                const encoder = new TextEncoder();
                await window.ModelCache.set(this.DATASET_CACHE_KEY, encoder.encode(text).buffer);
                console.log('[AI] Dataset saved to cache');
            }
        }

        this.qaData = text.split('\n').filter(l => l.trim()).map(l => {
            const entry = JSON.parse(l);
            const userMsg = entry.messages.find(m => m.role === 'user');
            entry.intent = userMsg ? this.labelEntryIntent(userMsg.content) : 'general';
            return entry;
        });

        this.buildBM25Index();
        console.log('[AI] Q&A dataset loaded:', this.qaData.length, 'entries (with intent labels + BM25 index)');
    },

    labelEntryIntent(text) {
        const textLower = text.toLowerCase();
        const scores = {};

        for (const [intent, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
            const score = keywords.reduce((count, kw) =>
                textLower.includes(kw.toLowerCase()) ? count + 1 : count, 0);
            if (score > 0) scores[intent] = score;
        }

        if (Object.keys(scores).length === 0) return 'general';
        return Object.entries(scores).reduce((best, [intent, score]) =>
            score > best.score ? { intent, score } : best,
            { intent: 'general', score: 0 }
        ).intent;
    },

    buildBM25Index() {
        const N = this.qaData.length;
        const docFreq = {};
        const docTermCounts = [];
        let totalTerms = 0;

        for (const entry of this.qaData) {
            const userMsg = entry.messages.find(m => m.role === 'user');
            const terms = userMsg
                ? userMsg.content.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !this.STOPWORDS.has(w))
                : [];
            docTermCounts.push(terms.length);
            totalTerms += terms.length;

            const uniqueTerms = new Set(terms);
            for (const term of uniqueTerms) {
                docFreq[term] = (docFreq[term] || 0) + 1;
            }
        }

        const idf = {};
        for (const [term, df] of Object.entries(docFreq)) {
            idf[term] = Math.log((N - df + 0.5) / (df + 0.5) + 1);
        }

        this.bm25Index = {
            idf,
            docTermCounts,
            avgDocLen: totalTerms / Math.max(N, 1)
        };
    },

    tokenize(text, maxLength = 128) {
        if (this.tokenizer && !this.useFallbackTokenizer) {
            return this.tokenizeWordPiece(text, maxLength);
        }
        return this.tokenizeFallback(text, maxLength);
    },

    /**
     * Tokenize text using the pure-JS WordPiece tokenizer
     * 
     * CONTEXT:
     * This method now uses our custom WordPieceTokenizer class instead of @xenova/transformers.
     * The tokenizer loads vocab from tokenizer-vocab.json (exported by the training script)
     * and implements the exact WordPiece algorithm used by HuggingFace transformers.
     * 
     * @param {string} text - Input text to tokenize
     * @param {number} maxLength - Maximum sequence length (default: 128)
     * @returns {{ inputIds: number[], attentionMask: number[] }}
     */
    tokenizeWordPiece(text, maxLength = 128) {
        // Use the pure-JS WordPiece tokenizer
        const result = this.tokenizer.tokenize(text, maxLength);
        
        return {
            inputIds: result.inputIds,
            attentionMask: result.attentionMask
        };
    },

    tokenizeFallback(text, maxLength = 128) {
        if (!this._loggedFallbackWarning) {
            console.warn('[AI] Using FALLBACK tokenizer (character-level). Accuracy may be reduced.');
            this._loggedFallbackWarning = true;
        }

        const tokens = [101];
        const words = text.toLowerCase().split(/\s+/);

        for (const word of words) {
            const chars = word.substring(0, 10).split('');
            for (let i = 0; i < chars.length; i++) {
                const c = chars[i].charCodeAt(0);
                if (c < 1000) tokens.push(c + 9000);
            }
            tokens.push(102);
            if (tokens.length >= maxLength - 1) break;
        }

        while (tokens.length < maxLength) tokens.push(0);

        const inputIds = tokens.slice(0, maxLength);
        const attentionMask = inputIds.map(id => id === 0 ? 0 : 1);

        return { inputIds, attentionMask };
    },

    softmax(logits) {
        const maxLogit = Math.max(...logits);
        const exps = logits.map(l => Math.exp(l - maxLogit));
        const sumExps = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sumExps);
    },

    async classifyIntent(question) {
        if (!this.session) {
            return { intents: ['general'], confidences: [1.0] };
        }

        const { inputIds, attentionMask } = this.tokenize(question);

        const inputIdsTensor = new ort.Tensor(
            'int64',
            BigInt64Array.from(inputIds.map(v => BigInt(v))),
            [1, inputIds.length]
        );

        const attentionMaskTensor = new ort.Tensor(
            'int64',
            BigInt64Array.from(attentionMask.map(v => BigInt(v))),
            [1, attentionMask.length]
        );

        const results = await this.session.run({
            'input_ids': inputIdsTensor,
            'attention_mask': attentionMaskTensor
        });

        const logits = Array.from(results.logits.data);
        const probs = this.softmax(logits);

        const sortedIndices = probs
            .map((p, i) => ({ p, i }))
            .sort((a, b) => b.p - a.p);

        const topProb = sortedIndices[0].p;
        const topIdx = sortedIndices[0].i;
        const topIntent = this.intentLabels[topIdx.toString()] || 'general';

        console.log('[AI] Intent probabilities:',
            sortedIndices.slice(0, 5).map(s =>
                `${this.intentLabels[s.i.toString()]}: ${(s.p * 100).toFixed(1)}%`
            ).join(', '));

        if (topProb < this.CONFIDENCE_THRESHOLD) {
            console.log(`[AI] Low confidence (${(topProb * 100).toFixed(1)}% < ${(this.CONFIDENCE_THRESHOLD * 100)}%), defaulting to general`);
            return { intents: ['general'], confidences: [topProb] };
        }

        const intents = [topIntent];
        const confidences = [topProb];

        if (sortedIndices.length > 1) {
            const secondProb = sortedIndices[1].p;
            const secondIdx = sortedIndices[1].i;
            const secondIntent = this.intentLabels[secondIdx.toString()] || 'general';

            if (secondProb >= this.MULTI_INTENT_THRESHOLD && secondIntent !== topIntent) {
                console.log(`[AI] Multi-intent detected: ${topIntent} (${(topProb * 100).toFixed(1)}%) + ${secondIntent} (${(secondProb * 100).toFixed(1)}%)`);
                intents.push(secondIntent);
                confidences.push(secondProb);
            }
        }

        return { intents, confidences };
    },

    correctIntent(question, modelIntents, modelConfidences) {
        const q = question.toLowerCase();
        const scores = {};

        for (const [intent, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
            scores[intent] = 0;
            for (const kw of keywords) {
                if (q.includes(kw.toLowerCase())) {
                    scores[intent] += kw.includes(' ') ? 3 : 1;
                }
            }
        }

        const sorted = Object.entries(scores)
            .filter(([, s]) => s > 0)
            .sort((a, b) => b[1] - a[1]);

        console.log('[AI] Keyword scores:', sorted.map(([intent, score]) => `${intent}: ${score}`).join(', '));

        if (sorted.length === 0) {
            return { intents: modelIntents, confidences: modelConfidences };
        }

        const topKwIntent = sorted[0][0];
        const topKwScore = sorted[0][1];
        const modelIntent = modelIntents[0];
        const modelConf = modelConfidences[0];

        if (topKwIntent !== modelIntent && topKwScore >= 3) {
            console.log(`[AI] Keyword correction: ${modelIntent} (${(modelConf * 100).toFixed(1)}%) → ${topKwIntent} (kw score: ${topKwScore})`);
            return { intents: [topKwIntent], confidences: [0.9] };
        }

        if (topKwIntent !== modelIntent && topKwScore >= 4) {
            console.log(`[AI] Strong keyword override: ${modelIntent} → ${topKwIntent} (kw score: ${topKwScore})`);
            return { intents: [topKwIntent], confidences: [0.95] };
        }

        return { intents: modelIntents, confidences: modelConfidences };
    },

    async classifyAndCorrect(question) {
        const raw = await this.classifyIntent(question);
        console.log('[AI] Raw classification:', raw.intents[0], (raw.confidences[0] * 100).toFixed(1) + '%');
        try {
            return this.correctIntent(question, raw.intents, raw.confidences);
        } catch (e) {
            console.error('[AI] correctIntent error:', e.message);
            return raw;
        }
    },

    bm25Score(queryTerms, docText, docLen) {
        const docTerms = docText.toLowerCase().split(/\s+/);
        const termFreqs = {};
        for (const t of docTerms) {
            termFreqs[t] = (termFreqs[t] || 0) + 1;
        }

        const { idf, avgDocLen } = this.bm25Index;
        const k1 = this.BM25_K1;
        const b = this.BM25_B;
        let score = 0;

        for (const term of queryTerms) {
            const tf = termFreqs[term] || 0;
            if (tf === 0) continue;

            const termIdf = idf[term] || 0;
            const numerator = tf * (k1 + 1);
            const denominator = tf + k1 * (1 - b + b * docLen / avgDocLen);
            score += termIdf * (numerator / denominator);
        }

        return score;
    },

    levenshteinDistance(a, b) {
        const m = a.length;
        const n = b.length;

        if (Math.abs(m - n) > this.FUZZY_MAX_DISTANCE) return this.FUZZY_MAX_DISTANCE + 1;

        const dp = Array.from({ length: m + 1 }, (_, i) => {
            const row = new Array(n + 1);
            row[0] = i;
            return row;
        });
        for (let j = 1; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }

        return dp[m][n];
    },

    fuzzyMatch(queryWord, docWords) {
        if (queryWord.length < this.FUZZY_MIN_WORD_LENGTH) return false;

        for (const dw of docWords) {
            if (dw.length < this.FUZZY_MIN_WORD_LENGTH) continue;
            if (this.levenshteinDistance(queryWord, dw) <= this.FUZZY_MAX_DISTANCE) return true;
        }
        return false;
    },

    _extractAnswer(entry) {
        const assistantMsg = entry.messages.find(m => m.role === 'assistant');
        return assistantMsg ? assistantMsg.content : null;
    },

    _qaDataForWorker() {
        return this.qaData.map(entry => {
            const userMsg = entry.messages.find(m => m.role === 'user');
            const assistantMsg = entry.messages.find(m => m.role === 'assistant');
            return {
                question: userMsg ? userMsg.content : '',
                answer: assistantMsg ? assistantMsg.content : '',
                intent: entry.intent || 'general'
            };
        });
    },

    async findRelevantQA(question, intents) {
        if (this.workerReady) {
            try {
                const workerData = this._qaDataForWorker();
                const result = await this._workerCall('search', {
                    question,
                    intents,
                    qaData: workerData
                }, 15000);

                if (result && result.type === 'search-result' && result.answer) {
                    console.log(`[AI] Worker found match (score=${result.score.toFixed(2)})`);
                    return result.answer;
                }
            } catch (e) {
                console.warn('[AI] Worker search failed, falling back:', e.message);
            }
        }

        const lowerQ = question.toLowerCase();
        const queryTerms = lowerQ.split(/\s+/).filter(w => w.length > 2 && !this.STOPWORDS.has(w));

        const scoreEntries = (candidates) => {
            let bestMatch = null;
            let bestScore = 0;

            for (const candidate of candidates) {
                const idx = this.qaData.indexOf(candidate);
                const userMsg = candidate.messages.find(m => m.role === 'user');
                if (!userMsg) continue;

                const docLen = this.bm25Index.docTermCounts[idx] || 0;
                let score = this.bm25Score(queryTerms, userMsg.content, docLen);

                if (score < this.BM25_MIN_SCORE) {
                    const docWords = userMsg.content.toLowerCase().split(/\s+/);
                    let fuzzyHits = 0;
                    for (const qt of queryTerms) {
                        if (qt.length >= this.FUZZY_MIN_WORD_LENGTH && this.fuzzyMatch(qt, docWords)) {
                            fuzzyHits++;
                        }
                    }
                    if (fuzzyHits > 0) {
                        score = Math.max(score, fuzzyHits * 2);
                    }
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = candidate;
                }
            }

            return { match: bestMatch, score: bestScore };
        };

        const filteredData = this.qaData.filter(entry => intents.includes(entry.intent));

        if (filteredData.length > 0) {
            const result = scoreEntries(filteredData);
            if (result.match && result.score >= this.BM25_MIN_SCORE) {
                console.log(`[AI] Found match (intent-filtered, BM25=${result.score.toFixed(2)})`);
                return this._extractAnswer(result.match);
            }
        }

        const result = scoreEntries(this.qaData);
        if (result.match && result.score >= this.BM25_MIN_SCORE) {
            console.log(`[AI] Found match (full-dataset, BM25=${result.score.toFixed(2)})`);
            return this._extractAnswer(result.match);
        }

        console.log('[AI] No BM25 match above threshold (', this.BM25_MIN_SCORE, ')');
        return null;
    },

    async generate(messages) {
        try {
            const userMessage = messages.filter(m => m.role === 'user').pop();
            if (!userMessage) {
                return "Hello! Ask me about digital transformation, marketing, IT management, design thinking, or capability building!";
            }

            const question = userMessage.content;
            console.log('[AI] Question:', question);

            const identityResponse = this.getIdentityResponse(question);
            if (identityResponse) {
                console.log('[AI] Identity query detected');
                this.trackResponse(identityResponse);
                return identityResponse;
            }

            const rawClassification = await this.classifyIntent(question);
            console.log('[AI] Raw classification:', rawClassification.intents[0], (rawClassification.confidences[0] * 100).toFixed(1) + '%');
            let classification;
            try {
                classification = this.correctIntent(question, rawClassification.intents, rawClassification.confidences);
            } catch (e) {
                console.error('[AI] correctIntent error:', e.message);
                classification = rawClassification;
            }
            console.log('[AI] Intents:', classification.intents.join(', '),
                '| Confidences:', classification.confidences.map(c => (c * 100).toFixed(1) + '%').join(', '));

            const answer = await this.findRelevantQA(question, classification.intents);
            if (answer) {
                console.log('[AI] Found Q&A match');
                const finalAnswer = this.getDeduplicatedResponse(answer, classification.intents[0]);
                this.trackResponse(finalAnswer);
                return finalAnswer;
            }

            const fallback = this.getFallbackResponse(question, classification.intents[0]);
            const finalFallback = this.getDeduplicatedResponse(fallback, classification.intents[0]);
            this.trackResponse(finalFallback);
            return finalFallback;

        } catch (error) {
            console.error('[AI] Generation error:', error);
            const userMsg = messages.filter(m => m.role === 'user').pop();
            return this.getFallbackResponse(userMsg ? userMsg.content : '', 'general');
        }
    },

    trackResponse(response) {
        this.recentResponses.push(response);
        if (this.recentResponses.length > this.MAX_RECENT_RESPONSES) {
            this.recentResponses.shift();
        }
    },

    getDeduplicatedResponse(response, intent) {
        if (!this.recentResponses.includes(response)) {
            return response;
        }

        console.log('[AI] Response recently given, providing variation');
        
        const variations = {
            digital_transformation: [
                "Digital transformation involves reimagining how a business operates and delivers value to customers using digital technologies. Would you like to explore specific aspects like cloud adoption, digital roadmaps, or modernizing legacy systems?",
                "At VVG ONLINE, we help businesses navigate digital transformation through strategic planning, technology adoption, and organizational change management. What area interests you most?"
            ],
            design_thinking: [
                "Design thinking workshops are collaborative sessions that help teams solve complex problems through empathy, ideation, prototyping, and testing. These typically run 2-3 days for meaningful outcomes. Would you like to know more about our workshop format?",
                "Our design thinking approach focuses on human-centered problem-solving. We guide teams through empathy mapping, ideation sessions, and rapid prototyping to develop innovative solutions. How can we help your team?"
            ],
            capability_building: [
                "Capability building is about equipping your workforce with the skills needed for digital agility and innovation. We offer training programs, skill rotation frameworks, and competency assessments. What specific capabilities are you looking to develop?",
                "We help organizations build internal capabilities through structured learning programs, mentorship, and hands-on workshops. Would you like to discuss your team's training needs?"
            ],
            digital_marketing: [
                "Strategic digital marketing combines data-driven approaches with creative execution across SEO, content marketing, social media, and paid advertising. What specific marketing challenges are you facing?",
                "Our digital marketing services focus on measurable ROI through targeted campaigns, conversion optimization, and customer journey mapping. Which area would you like to explore first?"
            ],
            it_management: [
                "Comprehensive IT management ensures your infrastructure is secure, reliable, and scalable. We cover cybersecurity, governance, cloud infrastructure, and operational efficiency. What's your priority?",
                "Our IT management solutions include threat assessment, zero-trust architecture, disaster recovery planning, and compliance frameworks. How can we support your IT operations?"
            ],
            strategy_innovation: [
                "Strategic innovation involves identifying new growth opportunities, developing business cases, and implementing change management frameworks. What strategic challenges are you addressing?",
                "We help businesses develop competitive advantage through strategic roadmaps, KPI frameworks, and innovation management. Would you like to discuss your strategic goals?"
            ],
            general: [
                "I can help with digital transformation, strategic marketing, IT management, design thinking workshops, and capability building. What would you like to explore?",
                "VVG ONLINE specializes in helping businesses navigate digital change. Feel free to ask about any of our service areas!"
            ]
        };

        const intentVariations = variations[intent] || variations.general;
        const randomVariation = intentVariations[Math.floor(Math.random() * intentVariations.length)];
        
        return randomVariation;
    },

    getIdentityResponse(question) {
        const q = question.toLowerCase().trim();
        
        const identityPatterns = [
            { patterns: ['who are you', 'what are you', 'your name', 'what is your name', 'what should i call you'], 
              response: "I'm Vikas AI, VVG ONLINE's intelligent assistant. I help businesses navigate digital transformation, strategic marketing, IT management, design thinking, and capability building. How can I assist you today?" },
            
            { patterns: ['what can you do', 'what do you do', 'how can you help', 'what are you capable of', 'what services'],
              response: "I can help you with:\n• Digital transformation strategies and roadmaps\n• Strategic digital marketing (SEO, content, social media)\n• IT management and cybersecurity\n• Design thinking workshops and problem-solving\n• Capability building and team training\n\nWhat area interests you most?" },
            
            { patterns: ['who made you', 'who created you', 'who built you', 'your creator', 'your developer'],
              response: "I was created by VVG ONLINE, a strategic consulting firm specializing in digital transformation, innovative design thinking, and capability building. I'm here to help you explore how we can support your business goals." },
            
            { patterns: ['are you human', 'are you real', 'are you a bot', 'are you ai', 'artificial intelligence'],
              response: "I'm an AI assistant powered by machine learning, running entirely in your browser for privacy and speed. While I'm not human, I'm designed to provide helpful, accurate information about VVG ONLINE's services and expertise." },
            
            { patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
              response: "Hello! I'm Vikas AI, here to help with digital transformation, strategic marketing, IT management, design thinking, and capability building. What would you like to explore today?" }
        ];
        
        for (const item of identityPatterns) {
            if (item.patterns.some(pattern => q.includes(pattern))) {
                return item.response;
            }
        }
        
        return null;
    },

    getFallbackResponse(question, intent) {
        const intentResponses = {
            digital_transformation: 'Digital transformation is the process of using digital technologies to create new or modify existing business processes, culture, and customer experiences to meet changing business and market requirements.',
            design_thinking: 'Design thinking workshops help teams solve complex problems through empathizing with users, defining problems, ideating solutions, prototyping, and testing. These workshops typically last 2-3 days for meaningful results.',
            capability_building: 'Capability building equips your team with necessary skills and knowledge to adapt to new technologies and business models, driving innovation and maintaining competitive advantage.',
            digital_marketing: 'Strategic digital marketing helps businesses increase brand awareness, generate leads, drive sales, and improve customer engagement through data-driven approaches using SEO, social media, content marketing, and analytics.',
            it_management: 'IT management solutions ensure your IT infrastructure is reliable, secure, and efficient, leading to reduced downtime, improved security, lower operational costs, and better overall business performance.',
            strategy_innovation: 'We help develop clear strategic roadmaps, identify new growth opportunities, and implement innovative solutions that leverage the latest technologies to give you a competitive advantage.',
            general: 'I can help with business consulting topics including digital transformation, strategic marketing, IT management, design thinking workshops, and capability building. What would you like to know?'
        };

        return intentResponses[intent] || intentResponses.general;
    }
};
