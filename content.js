const TWEET_ARTICLE_SELECTOR = 'article[data-testid="tweet"]';
let contentAnalyzer = null;
let DebugLogger = null;

// Fallback logging function in case DebugLogger fails
function fallbackLog(type, message, data) {
    console.log(`[${type}] ${message}`, data || '');
}

async function initializeAnalyzer() {
    try {
        const response = await fetch(chrome.runtime.getURL('config.json'));
        const config = await response.json();
        
        const { default: ContentAnalyzer } = await import(
            chrome.runtime.getURL('political_analysis.js')
        );
        const debugModule = await import(chrome.runtime.getURL('debug_utils.js'));
        DebugLogger = debugModule.default;
        
        contentAnalyzer = new ContentAnalyzer(config.GEMINI_API_KEY);
        (DebugLogger || { log: fallbackLog }).log('INFO', 'Content analyzer initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing analyzer:', error);
        fallbackLog('ERROR', 'Failed to initialize analyzer', error);
        return false;
    }
}

async function shouldBlock(text) {
    if (!contentAnalyzer) {
        const initialized = await initializeAnalyzer();
        if (!initialized) {
            fallbackLog('ERROR', 'Analyzer not initialized', { text });
            return false;
        }
    }
    
    try {
        const result = await contentAnalyzer.analyzeContent(text);
        (DebugLogger || { contentProcessed: fallbackLog }).contentProcessed(text, result);
        return result;
    } catch (error) {
        console.error('Error analyzing content:', error);
        fallbackLog('ERROR', 'Failed to analyze content', { text, error });
        return false;
    }
}

async function processTweet(tweetElement) {
    const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
    if (!tweetTextElement) {
        fallbackLog('ERROR', 'No tweet text found in element');
        return;
    }

    const tweetText = tweetTextElement.textContent;
    fallbackLog('INFO', 'Processing content', tweetText.slice(0, 100) + '...');
    
    if (await shouldBlock(tweetText)) {
        // Ensure the tweet element can position the overlay
        if (window.getComputedStyle(tweetElement).position === 'static') {
            tweetElement.style.position = 'relative';
        }
        
        // Add block overlay with 20% opacity red background
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 0, 0, 0.2);
            padding: 10px;
            border: 2px solid rgba(255, 0, 0, 0.5);
            font-size: 14px;
            color: red;
            z-index: 9999;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
        `;
        overlay.textContent = '🚫 Content blocked';
        
        tweetElement.appendChild(overlay);
        fallbackLog('INFO', 'Content blocked', { tweetText });
    }
}

function observeTweets() {
    fallbackLog('INFO', 'Starting tweet observation...');
    
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches(TWEET_ARTICLE_SELECTOR)) {
                        processTweet(node);
                    }
                    const tweets = node.querySelectorAll(TWEET_ARTICLE_SELECTOR);
                    tweets.forEach(processTweet);
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Process any tweets that are already on the page
    document.querySelectorAll(TWEET_ARTICLE_SELECTOR).forEach(processTweet);
}

// Start observing when the content script loads
console.log('Content script loaded, initializing...');
initializeAnalyzer().then(() => {
    observeTweets();
    // Add debug command to window for easy access
    window.debugTwitterPolitics = async () => {
        if (DebugLogger) {
            await DebugLogger.printStats();
        } else {
            console.log('Debug logger not initialized');
        }
    };
}).catch(error => {
    console.error('Failed to initialize:', error);
});