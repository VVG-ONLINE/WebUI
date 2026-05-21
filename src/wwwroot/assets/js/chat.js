// chat.js - FIXED using Transformers.js for proper tokenization

window.transformersChat = {
    session: null,
    tokenizer: null,
    dotnetHelper: null,
    pipeline: null,

    async init(dotnetHelper) {
        this.dotnetHelper = dotnetHelper;

        try {
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading AI libraries...');
            await this.loadTransformersJS();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading tokenizer...');
            await this.loadTokenizer();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading ONNX Runtime...');
            await this.loadOnnxRuntime();

            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', 'Loading model (~79MB)...');
            await this.loadModel();

            console.log("✓ Model ready");
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', '');  // Clear progress
            await this.dotnetHelper.invokeMethodAsync('OnModelReady');
            await this.dotnetHelper.invokeMethodAsync('OnSystemPromptReady', 'AI model ready');

        } catch (error) {
            console.error("INIT ERROR:", error);
            // await this.dotnetHelper.invokeMethodAsync('UpdateProgress', `Error: ${error.message}`);
            await this.dotnetHelper.invokeMethodAsync('UpdateProgress', `Error: Failed to load AI model. Please try again later.`);
        }
    },

    async loadTransformersJS() {
        if (typeof AutoTokenizer === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
                script.type = 'module';
                script.onload = () => {
                    console.log('✓ Transformers.js loaded');
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load Transformers.js'));
                document.head.appendChild(script);
            });
        }
    },

    async loadTokenizer() {
        try {
            // Use Transformers.js to load GPT-2 tokenizer properly
            const { AutoTokenizer } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');

            // Load from your HuggingFace repo
            this.tokenizer = await AutoTokenizer.from_pretrained('VVGONLINE/vikas-ai-consultant');

            console.log('✓ Tokenizer loaded from HuggingFace');

        } catch (error) {
            console.error('Tokenizer load failed, using fallback:', error);
            // Fallback to GPT-2 base if your model files have issues
            const { AutoTokenizer } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
            this.tokenizer = await AutoTokenizer.from_pretrained('gpt2');
            console.log('✓ Using GPT-2 fallback tokenizer');
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
                    console.log('✓ ONNX Runtime loaded');
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load ONNX Runtime'));
                document.head.appendChild(script);
            });
        }
    },

    async loadModel() {
        try {
            // const modelUrl = 'https://huggingface.co/VVGONLINE/vikas-ai-consultant/resolve/main/model_quantized.onnx';
            const modelUrl = 'scripts\vikas-dataset-augmented.jsonl';

            console.log('Downloading model...');

            this.session = await ort.InferenceSession.create(modelUrl, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all',
                enableMemPattern: true,
                enableCpuMemArena: true
            });

            console.log('✓ Model loaded');
            console.log('Inputs:', this.session.inputNames);
            console.log('Outputs:', this.session.outputNames);

        } catch (error) {
            console.error('Model load failed:', error);
            throw error;
        }
    },

    async generate(messages) {
        if (!this.session || !this.tokenizer) {
            return 'Error: Model not initialized';
        }

        try {
            // Get user's question
            const userMessage = messages.filter(m => m.role === 'user').pop();
            if (!userMessage) {
                return "Hello! I'm trained on business consulting. Ask me about digital transformation, marketing, IT management, design thinking, or capability building!";
            }

            const question = userMessage.content;
            console.log('Question:', question);

            // Format prompt to match training format
            const prompt = `Question: ${question}\nAnswer:`;

            // Encode using proper GPT-2 tokenizer
            const encoded = await this.tokenizer(prompt);
            const inputIds = Array.from(encoded.input_ids.data);

            console.log('Input tokens:', inputIds.length);

            // Pad/truncate to fixed length
            const maxLength = 128;
            const paddedInput = new Array(maxLength).fill(50256); // GPT-2 PAD token
            for (let i = 0; i < Math.min(inputIds.length, maxLength); i++) {
                paddedInput[i] = inputIds[i];
            }

            // Create attention mask
            const attentionMask = paddedInput.map(id => id === 50256 ? 0 : 1);

            // Create ONNX tensors
            const inputIdsTensor = new ort.Tensor(
                'int64',
                BigInt64Array.from(paddedInput.map(v => BigInt(v))),
                [1, maxLength]
            );

            const attentionMaskTensor = new ort.Tensor(
                'int64',
                BigInt64Array.from(attentionMask.map(v => BigInt(v))),
                [1, maxLength]
            );

            console.log('Running inference...');

            // Run model
            const results = await this.session.run({
                'input_ids': inputIdsTensor,
                'attention_mask': attentionMaskTensor
            });

            console.log('✓ Inference complete');

            // Get logits
            const logits = results.logits.data;
            const vocabSize = 50257;

            // Greedy decode - get most likely token at each position
            const outputTokens = [];
            const startIdx = inputIds.length;
            const maxNewTokens = 100;

            for (let pos = startIdx; pos < Math.min(startIdx + maxNewTokens, maxLength); pos++) {
                const offset = pos * vocabSize;
                let maxLogit = -Infinity;
                let maxToken = 0;

                // Find token with highest probability
                for (let tokenId = 0; tokenId < vocabSize; tokenId++) {
                    const logit = logits[offset + tokenId];
                    if (logit > maxLogit) {
                        maxLogit = logit;
                        maxToken = tokenId;
                    }
                }

                // Stop at PAD or EOS
                if (maxToken === 50256 || maxToken === 50257) break;

                outputTokens.push(maxToken);
            }

            console.log('Generated tokens:', outputTokens.length);

            // Decode using proper tokenizer
            let answer = await this.tokenizer.decode(outputTokens, { skip_special_tokens: true });

            // Clean up answer
            answer = answer
                .replace(/Question:/g, '')
                .replace(/Answer:/g, '')
                .trim();

            console.log('Answer:', answer);

            // If answer is empty or too short, use fallback
            if (!answer || answer.length < 15) {
                return this.getFallbackResponse(question);
            }

            return answer;

        } catch (error) {
            console.error('Generation error:', error);
            const userMsg = messages.filter(m => m.role === 'user').pop();
            return this.getFallbackResponse(userMsg ? userMsg.content : '');
        }
    },

    getFallbackResponse(question) {
        const lowerQ = question.toLowerCase();

        if (lowerQ.includes('digital') || lowerQ.includes('transformation')) {
            return "Digital transformation is the process of using digital technologies to create new — or modify existing — business processes, culture, and customer experiences to meet changing business and market requirements.";
        }

        if (lowerQ.includes('marketing')) {
            return "Strategic digital marketing helps businesses increase brand awareness, generate leads, drive sales, and improve customer engagement through data-driven approaches using SEO, social media, content marketing, and analytics.";
        }

        if (lowerQ.includes('design thinking')) {
            return "Design thinking workshops help teams solve complex problems through empathizing with users, defining problems, ideating solutions, prototyping, and testing. These workshops typically last 2-3 days for meaningful results.";
        }

        if (lowerQ.includes('capability') || lowerQ.includes('building')) {
            return "Capability building equips your team with necessary skills and knowledge to adapt to new technologies and business models, driving innovation and maintaining competitive advantage.";
        }

        if (lowerQ.includes('it') || lowerQ.includes('management')) {
            return "IT management solutions ensure your IT infrastructure is reliable, secure, and efficient, leading to reduced downtime, improved security, lower operational costs, and better overall business performance.";
        }

        return "I can help with business consulting topics including digital transformation, strategic marketing, IT management, design thinking workshops, and capability building. What would you like to know?";
    }
};
