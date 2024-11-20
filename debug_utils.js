class DebugLogger {
    static COLORS = {
        HIDDEN: '#ff6b6b',
        SHOWN: '#51cf66',
        ERROR: '#ffd43b',
        INFO: '#339af0'
    };

    static log(type, message, data = null) {
        const timestamp = new Date().toISOString();
        const style = `color: white; background: ${this.COLORS[type]}; padding: 2px 5px; border-radius: 3px`;
        
        console.group(`%c${type} - ${timestamp}`, style);
        console.log('Message:', message);
        if (data) {
            console.log('Data:', data);
        }
        console.groupEnd();
    }

    static contentProcessed(contentText, isBlocked, error = null) {
        const type = error ? 'ERROR' : (isBlocked ? 'HIDDEN' : 'SHOWN');
        const data = {
            contentText: contentText?.slice(0, 100) + '...',
            fullText: contentText,
            isBlocked,
            error,
            timestamp: new Date().toISOString()
        };

        this.log(type, isBlocked ? 'Content hidden' : 'Content shown', data);
        this.updateStats(type);
    }

    static async updateStats(type) {
        const stats = await this.getStats();
        stats[type] = (stats[type] || 0) + 1;
        stats.totalProcessed = (stats.totalProcessed || 0) + 1;
        chrome.storage.local.set({ debugStats: stats });
    }

    static async getStats() {
        const result = await chrome.storage.local.get('debugStats');
        return result.debugStats || {};
    }

    static async printStats() {
        const stats = await this.getStats();
        console.group('%cContent Filter Stats', 'color: white; background: #339af0; padding: 2px 5px; border-radius: 3px');
        console.log('Total content processed:', stats.totalProcessed || 0);
        console.log('Hidden content:', stats.HIDDEN || 0);
        console.log('Shown content:', stats.SHOWN || 0);
        console.log('Errors:', stats.ERROR || 0);
        console.groupEnd();
    }
}

export default DebugLogger;