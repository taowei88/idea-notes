# 灵感笔记

极简的跨平台灵感记录工具，支持闪念和待办管理，数据存储在 Notion。

## 功能特性

- 快速记录闪念和待办事项
- 支持类型切换（闪念/待办）
- 状态管理（进行中/已完成）
- 数据存储在 Notion，安全可靠
- 响应式设计，支持手机端使用

## 使用方法

1. 在 Notion 中创建数据库，包含以下属性：
   - Title (标题) - 文本类型
   - Type (类型) - 选择类型，选项：闪念、待办
   - Status (状态) - 选择类型，选项：进行中、已完成

2. 获取 Notion API Key：
   - 访问 https://www.notion.so/my-integrations
   - 创建新集成，复制 API Token

3. 获取数据库 ID：
   - 打开 Notion 数据库页面
   - 从 URL 中复制 32 位数据库 ID

4. 在应用设置中输入 API Key 和 Database ID

## 开发

直接打开 `index.html` 即可运行，无需额外依赖。
