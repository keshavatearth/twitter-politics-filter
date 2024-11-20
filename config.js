let config = {};

try {
    const response = await fetch(chrome.runtime.getURL('config.json'));
    config = await response.json();
} catch (error) {
    console.error('Error loading config:', error);
}

export default config;