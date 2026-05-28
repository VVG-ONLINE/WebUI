/**
 * chat.js — ONNX Intent Classifier + JSONL Q&A Retrieval
 *
 * This is the AI chatbot engine for VVG ONLINE ("Vikas AI"). It runs
 * entirely in the user's browser — no server required for inference.
 *
 * Architecture (two-tier fallback):
 *
 *   Tier 1 (ONNX): Downloads a DistilBERT intent classifier (~64MB, ONNX format),
 *                  tokenises the user's question, runs inference to classify
 *                  the intent category, then searches a JSONL Q&A dataset
 *                  for the best matching pre-written answer.
 *
 *   Tier 2 (JSONL only): If the ONNX model fails to download or load,
 *                        falls back to keyword-matching against the same
 *                        JSONL dataset without intent classification.
 *
 * Data flow:
 *   C# (MainLayout.razor.cs) → JS (chat.js) → ONNX Runtime Web → HuggingFace CDN
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
    session: null,          // ONNX InferenceSession (null if model failed to load)
    tokenizer: null,        // (reserved for future HuggingFace tokenizer integration)
    dotnetHelper: null,     // .NET object reference for calling back into C#
    qaData: [],             // Pre-written Q&A pairs from vikas-dataset-augmented.jsonl
    intentLabels: null,     // Maps numeric IDs → intent category names (e.g. "digital_marketing")
    modelLoaded: false,     // True if ONNX model loaded successfully

    /**
     * Entry point — called from C# when the layout first loads.
     * Downloads ONNX Runtime from CDN, loads the Q&A dataset, then
     * attempts to load the intent classifier ONNX model.
     *
     * If any step fails, the chatbot falls back to JSONL-only mode
     * and still calls OnModelReady so the UI works.
     *
     * @param {DotNetObjectReference} dotnetHelper — reference to MainLayout in C#
     */
    async init(dotnetHelper) {
        this.dotnetHelper = dotnetHelper;

        try {
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading AI libraries...');
            await this.loadOnnxRuntime();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading Q&A dataset...');
            await this.loadQaData();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading intent classifier (~64MB)...');
            await this.loadModel();

            if (this.modelLoaded) {
                console.log('AI ready: ONNX + JSONL mode');
                await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI model ready');
                await this.dotnetHelper.invokeMethodAsync('OnChatOnline');
            } else {
                console.log('AI ready: JSONL back-up mode only');
                await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI ready (limited mode)');
            }

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', '');
            await this.dotnetHelper.invokeMethodAsync('OnModelReady');

        } catch (error) {
            console.error('INIT ERROR:', error);
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', '');
            await this.dotnetHelper.invokeMethodAsync('OnModelReady');
            await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI ready (limited mode)');
        }
    },

    /**
     * Dynamically loads ONNX Runtime Web from jsDelivr CDN.
     * Sets up WebAssembly execution (the ONNX model runs in WASM, not WebGPU).
     * Uses a Promise so the rest of init() waits until the script is ready.
     */
    async loadOnnxRuntime() {
        if (typeof ort === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.min.js';
                script.onload = () => {
                    // Point ONNX runtime to the CDN for its WASM worker files
                    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';
                    ort.env.wasm.numThreads = 1;  // Single thread to avoid conflicts with Blazor
                    console.log('ONNX Runtime loaded');
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load ONNX Runtime'));
                document.head.appendChild(script);
            });
        }
    },

    /**
     * Downloads and initialises the DistilBERT intent classifier ONNX model.
     * The model (~64MB) maps user questions to one of 8+ intent categories:
     * digital_transformation, design_thinking, capability_building,
     * digital_marketing, it_management, strategy_innovation, general, etc.
     *
     * Also loads intent-labels.json which maps output index → category name.
     */
    async loadModel() {
        try {
            const modelUrl = 'assets/models/intent-classifier.onnx';
            const labelsUrl = 'assets/models/intent-labels.json';

            // Download labels and model in parallel for speed
            const [labelsRes, session] = await Promise.all([
                fetch(labelsUrl).then(r => r.json()),
                ort.InferenceSession.create(modelUrl, {
                    executionProviders: ['wasm'],     // Run in WebAssembly (no WebGPU needed)
                    graphOptimizationLevel: 'all',    // Apply all ONNX optimisations
                    enableMemPattern: true,           // Reuse memory buffers
                    enableCpuMemArena: true           // Pre-allocate memory pool
                })
            ]);

            this.intentLabels = labelsRes.labels;
            this.session = session;
            this.modelLoaded = true;
            console.log('Intent classifier loaded, classes:', Object.values(this.intentLabels));

        } catch (error) {
            console.warn('[AI] ONNX model failed to load, using back-up mode');
            console.warn('[AI] Error details:', error.message);
            this.session = null;
            this.modelLoaded = false;
        }
    },

    /**
     * Fetches the JSONL Q&A dataset from the server.
     * JSONL = one JSON object per line, each with a "messages" array
     * containing alternating user/assistant turns.
     *
     * Example entry:
     *   {"messages": [
     *     {"role":"user","content":"What is digital transformation?"},
     *     {"role":"assistant","content":"Digital transformation is..."}
     *   ]}
     */
    async loadQaData() {
        const res = await fetch('assets/data/vikas-dataset-augmented.jsonl');
        const text = await res.text();
        // Split on newlines, skip empty lines, parse each as JSON
        this.qaData = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        console.log('Q&A dataset loaded:', this.qaData.length, 'entries');
    },

    /**
     * Converts a text string into token IDs that the ONNX model can process.
     *
     * This is a SIMPLIFIED tokenizer — a real DistilBERT tokenizer would use
     * WordPiece with a 30,522-token vocabulary. This one uses a character-level
     * approach that approximates the behaviour well enough for intent classification.
     *
     * @param {string} text      — input question
     * @param {number} maxLength — maximum token count (default 128)
     * @returns {{inputIds: number[], attentionMask: number[]}}
     */
    tokenize(text, maxLength = 128) {
        // 101 = [CLS] token, marks the start
        const tokens = [101];
        const words = text.toLowerCase().split(/\s+/);

        for (const word of words) {
            const chars = word.substring(0, 10).split('');  // Cap at 10 chars per word
            for (let i = 0; i < chars.length; i++) {
                const c = chars[i].charCodeAt(0);
                if (c < 1000) tokens.push(c + 9000);  // Map char code to a token ID range
            }
            tokens.push(102);  // 102 = [SEP] token, marks word boundary
            if (tokens.length >= maxLength - 1) break;
        }

        // Pad to maxLength with zeros
        while (tokens.length < maxLength) tokens.push(0);

        const inputIds = tokens.slice(0, maxLength);

        // Attention mask: 1 for real tokens, 0 for padding
        const attentionMask = inputIds.map(id => id === 0 ? 0 : 1);

        return { inputIds, attentionMask };
    },

    /**
     * Runs the ONNX model to classify the user's question into an intent category.
     * Falls back to 'general' if the model isn't loaded.
     *
     * @param {string} question — user's input
     * @returns {Promise<string>} intent category (e.g. "digital_marketing")
     */
    async classifyIntent(question) {
        if (!this.session) return 'general';

        const { inputIds, attentionMask } = this.tokenize(question);

        // ONNX Runtime expects tensors. We use BigInt64Array for int64 type.
        const inputIdsTensor = new ort.Tensor(
            'int64',
            BigInt64Array.from(inputIds.map(v => BigInt(v))),
            [1, inputIds.length]          // Shape: [batch_size=1, sequence_length]
        );

        const attentionMaskTensor = new ort.Tensor(
            'int64',
            BigInt64Array.from(attentionMask.map(v => BigInt(v))),
            [1, attentionMask.length]
        );

        // Run inference — the model outputs logits (raw scores) for each class
        const results = await this.session.run({
            'input_ids': inputIdsTensor,
            'attention_mask': attentionMaskTensor
        });

        // The class with the highest logit score is the predicted intent
        const logits = Array.from(results.logits.data);
        const maxIdx = logits.indexOf(Math.max(...logits));
        return this.intentLabels[maxIdx.toString()] || 'general';
    },

    /**
     * Searches the Q&A dataset for the best matching pre-written answer.
     *
     * Scoring: counts how many words (≥4 chars) from the user's question
     * appear in each dataset question. The entry with the most matching words wins.
     *
     * @param {string} question — user's raw input
     * @param {string} intent   — predicted intent (currently unused, reserved for filtering)
     * @returns {string|null}   — the assistant's answer text, or null if no match found
     */
    findRelevantQA(question, intent) {
        const lowerQ = question.toLowerCase();
        const words = lowerQ.split(/\s+/).filter(w => w.length > 3);  // Skip short words

        let bestMatch = null;
        let bestScore = 0;

        for (const entry of this.qaData) {
            for (const msg of entry.messages) {
                if (msg.role === 'user') {
                    const lowerUser = msg.content.toLowerCase();
                    let score = 0;
                    for (const word of words) {
                        if (lowerUser.includes(word)) score++;
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = entry;
                    }
                }
            }
        }

        // Only return if at least one word matched
        if (bestMatch && bestScore > 0) {
            for (const msg of bestMatch.messages) {
                if (msg.role === 'assistant') return msg.content;
            }
        }

        return null;
    },

    /**
     * Main generation pipeline — called from C# when the user presses Enter.
     *
     * 1. Extract the latest user message from the conversation array
     * 2. Classify the intent (ONNX) or default to general
     * 3. Search the Q&A dataset for a matching pre-written answer
     * 4. If no match, return a fallback response based on the intent
     *
     * @param {Array} messages — conversation history [{role, content}, ...]
     * @returns {Promise<string>} — the AI's response text
     */
    async generate(messages) {
        try {
            // The last message with role="user" is the current question
            const userMessage = messages.filter(m => m.role === 'user').pop();
            if (!userMessage) {
                return "Hello! Ask me about digital transformation, marketing, IT management, design thinking, or capability building!";
            }

            const question = userMessage.content;
            console.log('Question:', question);

            const intent = await this.classifyIntent(question);
            console.log('Intent:', intent);

            const answer = this.findRelevantQA(question, intent);
            if (answer) {
                console.log('Found Q&A match');
                return answer;
            }

            return this.getFallbackResponse(question, intent);

        } catch (error) {
            console.error('Generation error:', error);
            const userMsg = messages.filter(m => m.role === 'user').pop();
            return this.getFallbackResponse(userMsg ? userMsg.content : '', 'general');
        }
    },

    /**
     * Returns a pre-written response when no Q&A match was found.
     * The response depends on the detected intent category.
     *
     * @param {string} question — user's question (currently unused, for future LLM integration)
     * @param {string} intent   — intent category from ONNX classifier
     * @returns {string} — a friendly fallback answer
     */
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
