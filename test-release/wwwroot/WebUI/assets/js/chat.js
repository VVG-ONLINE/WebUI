// chat.js - ONNX Intent Classifier + JSONL Q&A Retrieval

window.transformersChat = {
    session: null,
    tokenizer: null,
    dotnetHelper: null,
    qaData: [],
    intentLabels: null,

    async init(dotnetHelper) {
        this.dotnetHelper = dotnetHelper;

        try {
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading AI libraries...');
            await this.loadOnnxRuntime();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading intent classifier (~64MB)...');
            await this.loadModel();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading Q&A dataset...');
            await this.loadQaData();

            console.log('Model ready');
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', '');
            await this.dotnetHelper.invokeMethodAsync('OnModelReady');
            await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI model ready');

        } catch (error) {
            console.error('INIT ERROR:', error);
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Error: Failed to load AI model. Please try again later.');
        }
    },

    async loadOnnxRuntime() {
        if (typeof ort === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/ort.min.js';
                script.onload = () => {
                    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.2/dist/';
                    ort.env.wasm.numThreads = 1;
                    console.log('ONNX Runtime loaded');
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load ONNX Runtime'));
                document.head.appendChild(script);
            });
        }
    },

    async loadModel() {
        const modelUrl = 'assets/models/intent-classifier.onnx';
        const labelsUrl = 'assets/models/intent-labels.json';

        const [labelsRes, session] = await Promise.all([
            fetch(labelsUrl).then(r => r.json()),
            ort.InferenceSession.create(modelUrl, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all',
                enableMemPattern: true,
                enableCpuMemArena: true
            })
        ]);

        this.intentLabels = labelsRes.labels;
        this.session = session;
        console.log('Intent classifier loaded, classes:', Object.values(this.intentLabels));
    },

    async loadQaData() {
        const res = await fetch('assets/data/vikas-dataset-augmented.jsonl');
        const text = await res.text();
        this.qaData = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        console.log('Q&A dataset loaded:', this.qaData.length, 'entries');
    },

    tokenize(text, maxLength = 128) {
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

    async classifyIntent(question) {
        if (!this.session) return 'general';

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
        const maxIdx = logits.indexOf(Math.max(...logits));
        return this.intentLabels[maxIdx.toString()] || 'general';
    },

    findRelevantQA(question, intent) {
        const lowerQ = question.toLowerCase();
        const words = lowerQ.split(/\s+/).filter(w => w.length > 3);

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

        if (bestMatch && bestScore > 0) {
            for (const msg of bestMatch.messages) {
                if (msg.role === 'assistant') return msg.content;
            }
        }

        return null;
    },

    async generate(messages) {
        try {
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
