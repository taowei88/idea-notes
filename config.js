const Config = {
    get apiKey() {
        return localStorage.getItem('notion_api_key') || '';
    },
    set apiKey(value) {
        localStorage.setItem('notion_api_key', value);
    },

    get databaseId() {
        return localStorage.getItem('notion_database_id') || '';
    },
    set databaseId(value) {
        localStorage.setItem('notion_database_id', value);
    },

    isConfigured() {
        return this.apiKey && this.databaseId;
    }
};
