// ── Random Question Picker ──
// Reads a random question from vikas-dataset-augmented.jsonl and returns it

let _randomQuestionCache = null;

window.getRandomQuestion = async function () {
    try {
        if (_randomQuestionCache !== null) {
            return _randomQuestionCache;
        }

        const response = await fetch('/scripts/vikas-dataset-augmented.jsonl');
        if (!response.ok) {
            throw new Error('Failed to fetch dataset');
        }

        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        const data = JSON.parse(randomLine);
        const question = data.messages[0].content;

        _randomQuestionCache = question;
        return question;
    } catch (error) {
        console.error('Error fetching random question:', error);
        return "// Start Transformation. Try asking 'What is digital Transformation?'";
    }
};
