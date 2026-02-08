const API_BASE = 'https://api.notion.com/v1';

class NotionAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async request(endpoint, options = {}) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Notion-Version': '2025-09-03',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Notion API Error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    async createPage(properties) {
        return this.request('/pages', {
            method: 'POST',
            body: JSON.stringify({
                parent: { data_source_id: Config.databaseId },
                properties
            })
        });
    }

    async queryDatabase() {
        return this.request(`/data_sources/${Config.databaseId}/query`, {
            method: 'POST',
            body: JSON.stringify({})
        });
    }

    async updatePage(pageId, properties) {
        return this.request(`/pages/${pageId}`, {
            method: 'PATCH',
            body: JSON.stringify({ properties })
        });
    }

    async deletePage(pageId) {
        return this.request(`/pages/${pageId}`, {
            method: 'PATCH',
            body: JSON.stringify({ archived: true })
        });
    }
}

// 应用逻辑
class App {
    constructor() {
        this.api = null;
        this.records = [];
        this.initElements();
        this.bindEvents();
        this.loadSettings();
        this.checkConfig();
    }

    initElements() {
        this.quickInput = document.getElementById('quickInput');
        this.typeSelect = document.getElementById('typeSelect');
        this.recordList = document.getElementById('recordList');
        this.loading = document.getElementById('loading');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.pinBtn = document.getElementById('pinBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.apiKeyInput = document.getElementById('apiKey');
        this.databaseIdInput = document.getElementById('databaseId');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.recordCount = document.getElementById('recordCount');
    }

    bindEvents() {
        this.quickInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                this.addRecord();
            }
        });

        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.pinBtn.addEventListener('click', () => this.togglePin());
        this.refreshBtn.addEventListener('click', () => this.loadRecords());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
    }

    togglePin() {
        this.pinBtn.classList.toggle('pinned');
        if (window.alwaysOnTop) {
            window.alwaysOnTop.set(false);
        } else if (window.alwaysOnTop) {
            window.alwaysOnTop.set(true);
        }
    }

    updateRecordCount() {
        this.recordCount.textContent = `${this.records.length} 条记录`;
    }

    loadSettings() {
        this.apiKeyInput.value = Config.apiKey;
        this.databaseIdInput.value = Config.databaseId;
    }

    checkConfig() {
        if (!Config.isConfigured()) {
            this.openSettings();
        } else {
            this.initAPI();
            this.loadRecords();
        }
    }

    initAPI() {
        this.api = new NotionAPI(Config.apiKey);
    }

    openSettings() {
        this.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    saveSettings() {
        Config.apiKey = this.apiKeyInput.value.trim();
        Config.databaseId = this.databaseIdInput.value.trim();
        this.initAPI();
        this.loadRecords();
        this.closeSettings();
    }

    async loadRecords() {
        if (!this.api) return;

        this.loading.style.display = 'block';
        this.recordList.innerHTML = '';

        try {
            const data = await this.api.queryDatabase();
            this.records = data.results;
            this.renderRecords();
        } catch (error) {
            console.error('加载记录失败:', error);
            this.recordList.innerHTML = '<p class="error">加载失败，请检查配置</p>';
        } finally {
            this.loading.style.display = 'none';
        }
    }

    renderRecords() {
        this.recordList.innerHTML = this.records.map(record => this.renderRecord(record)).join('');
        this.bindRecordEvents();
        this.updateRecordCount();
    }

    renderRecord(record) {
        const title = record.properties['标题']?.title[0]?.plain_text || '无内容';
        const type = record.properties['选择']?.select?.name || '闪念';
        const status = record.properties['状态']?.select?.name === '已完成';
        const id = record.id;

        const typeIcon = type === '待办' ? '📋' : '💡';
        const statusIcon = status ? '✅' : '⬜';

        return `
            <li class="record-item ${status ? 'completed' : ''}" data-id="${id}" data-type="${type}">
                <span class="record-type">${typeIcon}</span>
                <span class="record-content">${this.escapeHtml(title)}</span>
                <div class="record-actions">
                    <button class="toggle-status">${statusIcon}</button>
                    <button class="toggle-type">🔄</button>
                    <button class="delete">🗑️</button>
                </div>
            </li>
        `;
    }

    bindRecordEvents() {
        document.querySelectorAll('.toggle-status').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleStatus(e.target.closest('.record-item')));
        });

        document.querySelectorAll('.toggle-type').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleType(e.target.closest('.record-item')));
        });

        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteRecord(e.target.closest('.record-item')));
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async addRecord() {
        const content = this.quickInput.value.trim();
        const type = this.typeSelect.value;

        try {
            await this.api.createPage({
                '标题': { title: [{ text: { content } }] },
                '选择': { select: { name: type === 'todo' ? '待办' : '闪念' } },
                '状态': { select: { name: '进行中' } }
            });

            this.quickInput.value = '';
            this.loadRecords();
        } catch (error) {
            console.error('添加记录失败:', error);
            alert('添加失败: ' + error.message);
        }
    }

    async toggleStatus(item) {
        const id = item.dataset.id;
        const isCompleted = item.classList.contains('completed');

        try {
            await this.api.updatePage(id, {
                '状态': { select: { name: isCompleted ? '进行中' : '已完成' } }
            });
            this.loadRecords();
        } catch (error) {
            console.error('更新状态失败:', error);
        }
    }

    async toggleType(item) {
        const id = item.dataset.id;
        const currentType = item.dataset.type;
        const newType = currentType === '待办' ? '闪念' : '待办';

        try {
            await this.api.updatePage(id, {
                '选择': { select: { name: newType } }
            });
            this.loadRecords();
        } catch (error) {
            console.error('更新类型失败:', error);
        }
    }

    async deleteRecord(item) {
        const id = item.dataset.id;

        if (!confirm('确定要删除这条记录吗？')) return;

        try {
            await this.api.deletePage(id);
            this.loadRecords();
        } catch (error) {
            console.error('删除记录失败:', error);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
