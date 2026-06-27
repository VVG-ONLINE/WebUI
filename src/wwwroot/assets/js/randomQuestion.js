// ── Random Question Picker ──
// Reads a random question from vikas-dataset-augmented.jsonl and returns it

const _datasetUrl = 'assets/data/vikas-dataset-augmented.jsonl';
const _fallbackQuestion = "// Try asking 'What is digital Transformation?'";
let _randomQuestionCache = null;

async function _fetchAndParse() {
    const response = await fetch(_datasetUrl);
    if (!response.ok) throw new Error('Failed to fetch dataset');
    const text = await response.text();
    return text.split('\n').filter(line => line.trim() !== '');
}

function _pickRandom(lines) {
    const randomLine = lines[Math.floor(Math.random() * lines.length)];
    return JSON.parse(randomLine).messages[0].content;
}

function _formatQuestion(q) {
    return "// Try asking '" + q + "'";
}

window.getRandomQuestion = async function () {
    try {
        if (_randomQuestionCache !== null) {
            return _randomQuestionCache;
        }
        const lines = await _fetchAndParse();
        _randomQuestionCache = _formatQuestion(_pickRandom(lines));
        return _randomQuestionCache;
    } catch (error) {
        console.error('Error fetching random question:', error);
        return _fallbackQuestion;
    }
};

window.getFreshRandomQuestion = async function () {
    try {
        const lines = await _fetchAndParse();
        return _formatQuestion(_pickRandom(lines));
    } catch (error) {
        console.error('Error fetching fresh random question:', error);
        return _fallbackQuestion;
    }
};

window.extractRawFromPlaceholder = function (formatted) {
    const match = formatted.match(/'([^']+)'/);
    return match ? match[1] : formatted;
};

window.getFreshRawQuestion = async function () {
    try {
        const lines = await _fetchAndParse();
        return _pickRandom(lines);
    } catch (error) {
        console.error('Error fetching fresh raw question:', error);
        return "What is digital Transformation?";
    }
};
