/**
 * wordpiece-tokenizer.js — Pure JavaScript WordPiece Tokenizer for DistilBERT
 * 
 * CONTEXT:
 * --------
 * The original implementation tried to use @xenova/transformers library loaded via CDN.
 * However, @xenova/transformers is an ES module that doesn't expose a global `window.transformers`
 * object when loaded as a regular <script> tag. This caused the tokenizer to fail silently,
 * falling back to a character-level approximation that produced garbage token IDs.
 * 
 * The DistilBERT model was trained with proper WordPiece tokenization (30,522 vocabulary),
 * so feeding it random character codes resulted in 100% "general" predictions.
 * 
 * SOLUTION:
 * ---------
 * This file implements a pure-JS WordPiece tokenizer that:
 * 1. Loads the tokenizer-vocab.json file exported by the training script
 * 2. Implements the exact WordPiece algorithm used by HuggingFace transformers
 * 3. Works as a regular <script> tag (no ES module required)
 * 4. Has zero external dependencies
 * 
 * ALGORITHM:
 * ----------
 * WordPiece tokenization works in two stages:
 * 
 * Stage 1: Basic Tokenization
 *   - Convert to lowercase
 *   - Strip accents (optional, disabled for uncased models)
 *   - Split on whitespace and punctuation
 *   - Example: "Hello, world!" → ["hello", ",", "world", "!"]
 * 
 * Stage 2: WordPiece Tokenization
 *   - For each word, find the longest matching subword in the vocabulary
 *   - If no match, split into characters and mark continuation pieces with "##" prefix
 *   - Example: "unhappiness" → ["un", "##ha", "##pp", "##iness"]
 *   - If a word can't be tokenized at all, use [UNK] token
 * 
 * Special Tokens:
 *   - [CLS] (101): Added at the start of every sequence (classification token)
 *   - [SEP] (102): Added at the end of every sequence (separator token)
 *   - [PAD] (0): Used to pad sequences to max_length
 *   - [UNK] (100): Used for out-of-vocabulary tokens
 * 
 * OUTPUT:
 * -------
 * Returns { inputIds: number[], attentionMask: number[] }
 *   - inputIds: Array of token IDs (length = max_length)
 *   - attentionMask: Array of 1s for real tokens, 0s for padding (length = max_length)
 * 
 * USAGE:
 * ------
 * const tokenizer = new WordPieceTokenizer();
 * await tokenizer.loadVocab('assets/models/tokenizer-vocab.json');
 * const { inputIds, attentionMask } = tokenizer.tokenize("What is digital transformation?", 128);
 */

(typeof self !== 'undefined' ? self : window).WordPieceTokenizer = class WordPieceTokenizer {
    constructor() {
        // Vocabulary mapping: token string → token ID
        this.vocab = null;
        
        // Reverse mapping: token ID → token string (for debugging)
        this.idsToTokens = null;
        
        // Special token IDs (standard for BERT/DistilBERT)
        this.PAD_ID = 0;      // [PAD] - padding token
        this.UNK_ID = 100;    // [UNK] - unknown token
        this.CLS_ID = 101;    // [CLS] - classification token (start of sequence)
        this.SEP_ID = 102;    // [SEP] - separator token (end of sequence)
        
        // Special token strings
        this.PAD_TOKEN = '[PAD]';
        this.UNK_TOKEN = '[UNK]';
        this.CLS_TOKEN = '[CLS]';
        this.SEP_TOKEN = '[SEP]';
        
        // Maximum word length to prevent infinite loops
        this.MAX_WORD_LEN = 100;
    }

    /**
     * Load vocabulary from JSON file
     * 
     * @param {string} vocabUrl - URL to tokenizer-vocab.json
     * @returns {Promise<void>}
     */
    async loadVocab(vocabUrl) {
        try {
            const response = await fetch(vocabUrl, { signal: AbortSignal.timeout(30000) });
            if (!response.ok) {
                throw new Error(`Failed to load vocab: HTTP ${response.status}`);
            }
            
            const vocabData = await response.json();
            
            // The vocab file has structure: { vocab: {...}, merges: [...], special_tokens: [...] }
            // We only need the vocab mapping
            this.vocab = vocabData.vocab || vocabData;
            
            // Build reverse mapping for debugging
            this.idsToTokens = {};
            for (const [token, id] of Object.entries(this.vocab)) {
                this.idsToTokens[id] = token;
            }
            
            console.log(`[WordPiece] Vocabulary loaded: ${Object.keys(this.vocab).length} tokens`);
            
        } catch (error) {
            console.error('[WordPiece] Failed to load vocabulary:', error);
            throw error;
        }
    }

    /**
     * Tokenize text into WordPiece token IDs
     * 
     * @param {string} text - Input text to tokenize
     * @param {number} maxLength - Maximum sequence length (default: 128)
     * @returns {{ inputIds: number[], attentionMask: number[] }}
     */
    tokenize(text, maxLength = 128) {
        if (!this.vocab) {
            throw new Error('Vocabulary not loaded. Call loadVocab() first.');
        }

        // Stage 1: Basic tokenization
        // Split text into words and punctuation
        const basicTokens = this._basicTokenize(text);
        
        // Stage 2: WordPiece tokenization
        // Convert each basic token into WordPiece subtokens
        const wordpieceTokens = [];
        for (const token of basicTokens) {
            const subtokens = this._wordpieceTokenize(token);
            wordpieceTokens.push(...subtokens);
        }
        
        // Add special tokens: [CLS] at start, [SEP] at end
        // Format: [CLS] token1 token2 ... tokenN [SEP]
        const tokensWithSpecial = [this.CLS_TOKEN, ...wordpieceTokens, this.SEP_TOKEN];
        
        // Convert tokens to IDs
        const inputIds = tokensWithSpecial.map(token => {
            const id = this.vocab[token];
            return id !== undefined ? id : this.UNK_ID;
        });
        
        // Create attention mask: 1 for real tokens, 0 for padding
        const attentionMask = new Array(inputIds.length).fill(1);
        
        // Pad or truncate to maxLength
        if (inputIds.length < maxLength) {
            // Pad with [PAD] tokens
            const padLength = maxLength - inputIds.length;
            inputIds.push(...new Array(padLength).fill(this.PAD_ID));
            attentionMask.push(...new Array(padLength).fill(0));
        } else if (inputIds.length > maxLength) {
            // Truncate (keep [CLS] at start, replace last token with [SEP])
            inputIds.length = maxLength;
            attentionMask.length = maxLength;
            inputIds[maxLength - 1] = this.SEP_ID;
            attentionMask[maxLength - 1] = 1;
        }
        
        return { inputIds, attentionMask };
    }

    /**
     * Stage 1: Basic tokenization
     * 
     * Performs:
     * 1. Lowercase conversion
     * 2. Whitespace tokenization
     * 3. Punctuation splitting
     * 
     * @param {string} text - Input text
     * @returns {string[]} - Array of basic tokens
     * @private
     */
    _basicTokenize(text) {
        // Convert to lowercase (DistilBERT uncased model)
        text = text.toLowerCase();
        
        // Tokenize on whitespace and punctuation
        // This regex splits on:
        // - Whitespace: \s+
        // - Punctuation: [!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]
        // But keeps the punctuation as separate tokens
        const tokens = [];
        const regex = /([^\w\s])|(\w+)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const token = match[0].trim();
            if (token.length > 0) {
                tokens.push(token);
            }
        }
        
        return tokens;
    }

    /**
     * Stage 2: WordPiece tokenization
     * 
     * Implements the greedy longest-match-first algorithm:
     * 1. Try to match the longest prefix in the vocabulary
     * 2. If match found, add it and continue with remainder
     * 3. If no match, mark next piece with "##" prefix and retry
     * 4. If word can't be tokenized at all, return [UNK]
     * 
     * Example:
     *   "unhappiness" → ["un", "##ha", "##pp", "##iness"]
     * 
     * @param {string} word - Single word to tokenize
     * @returns {string[]} - Array of WordPiece subtokens
     * @private
     */
    _wordpieceTokenize(word) {
        // Prevent infinite loops on very long words
        if (word.length > this.MAX_WORD_LEN) {
            return [this.UNK_TOKEN];
        }
        
        const subtokens = [];
        let start = 0;
        let isBad = false;
        
        // Greedy longest-match-first algorithm
        while (start < word.length) {
            let end = word.length;
            let currentSubtoken = null;
            
            // Try to find the longest matching subword
            while (start < end) {
                let substr = word.substring(start, end);
                
                // For continuation pieces (not at start of word), add "##" prefix
                if (start > 0) {
                    substr = '##' + substr;
                }
                
                // Check if this subword is in vocabulary
                if (this.vocab[substr] !== undefined) {
                    currentSubtoken = substr;
                    break;
                }
                
                // Try shorter substring
                end--;
            }
            
            // If no match found, mark word as bad and use [UNK]
            if (currentSubtoken === null) {
                isBad = true;
                break;
            }
            
            subtokens.push(currentSubtoken);
            start = end;
        }
        
        // If word couldn't be tokenized, return [UNK]
        if (isBad) {
            return [this.UNK_TOKEN];
        }
        
        return subtokens;
    }

    /**
     * Debug helper: Convert token IDs back to tokens
     * 
     * @param {number[]} inputIds - Array of token IDs
     * @returns {string[]} - Array of token strings
     */
    decode(inputIds) {
        if (!this.idsToTokens) {
            throw new Error('Vocabulary not loaded.');
        }
        
        return inputIds.map(id => this.idsToTokens[id] || '[???]');
    }
};
