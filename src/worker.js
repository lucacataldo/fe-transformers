import { pipeline, env } from "@xenova/transformers"


env.useBrowserCache = true
env.allowLocalModels = false

var summarizer = null;
var classifier = null;

const handlers = {
    async init() {
        const gpuAvailable = typeof navigator !== 'undefined' && 'gpu' in navigator;

        const baseConfig = {
            device: gpuAvailable ? 'webgpu' : 'wasm'
        }

        if (!summarizer) {
            summarizer = await pipeline('summarization', 'Xenova/t5-small', {
                ...baseConfig,
                min_length: 1,
                max_length: 10
            })
        }

        if (!classifier) {
            classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
                ...baseConfig
            })
        }

        postMessage({ type: 'initResult', payload: true })

    },
    async summarize(payload) {

        if (!summarizer) {
            postMessage({ type: 'error', payload: 'Model not loaded' })
            return
        }

        const result = await summarizer(payload)

        console.log("Summarization result", result);

        postMessage({ type: 'summarizeResult', payload: result[0]?.summary_text })
    },
    async classify(payload) {
        if (!classifier) {
            postMessage({ type: 'error', payload: 'Model not loaded' })
            return
        }

        const result = await classifier(payload, [
            "sports", "politics", "science", "technology",
            "geography", "art", "health", "economics", "religion", "cars",
            "videogames", "food", "fashion", "music", "movies", "travel"
        ])

        postMessage({ type: 'classifyResult', payload: result })
    }
}

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    const handler = handlers[type];

    if (!handler) {
        throw new Error(`Unknown worker handler: ${type}`);
    }

    await handler(payload);

}
