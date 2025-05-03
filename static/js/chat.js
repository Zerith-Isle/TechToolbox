const API_KEY = 'sk-652aa176796c4cbfbe74df20fd162f18';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

let currentChatId = Date.now().toString();
let messages = [];
let isTyping = false;

// 从本地存储加载历史对话
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const historyList = document.getElementById('historyList');
    
    historyList.innerHTML = history.map(chat => `
        <div class="history-item ${chat.id === currentChatId ? 'active' : ''}" 
             onclick="loadChat('${chat.id}')">
            <div class="history-item-content">
                ${chat.title || '新对话'}
                <div class="history-item-time">
                    ${new Date(chat.timestamp).toLocaleString()}
                </div>
            </div>
            <button class="delete-history-btn" onclick="deleteChat('${chat.id}')">×</button>
        </div>
    `).join('');
}

// 保存对话到本地存储
function saveChat() {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const chatIndex = history.findIndex(chat => chat.id === currentChatId);
    
    const chat = {
        id: currentChatId,
        title: messages[1]?.content?.substring(0, 30) || '新对话',
        messages: messages,
        timestamp: Date.now()
    };

    if (chatIndex === -1) {
        history.unshift(chat);
    } else {
        history[chatIndex] = chat;
    }

    localStorage.setItem('chatHistory', JSON.stringify(history));
    loadHistory();
}

// 加载指定对话
function loadChat(chatId) {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const chat = history.find(c => c.id === chatId);
    
    if (chat) {
        currentChatId = chatId;
        messages = chat.messages;
        renderMessages();
        loadHistory();
    }
}

// 删除指定对话
function deleteChat(chatId) {
    if (confirm('确定要删除这个对话吗？')) {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        const newHistory = history.filter(chat => chat.id !== chatId);
        localStorage.setItem('chatHistory', JSON.stringify(newHistory));
        
        if (currentChatId === chatId) {
            startNewChat();
        } else {
            loadHistory();
        }
    }
}

// 开始新对话
function startNewChat() {
    currentChatId = Date.now().toString();
    messages = [{
        role: 'assistant',
        content: '你好！我是你的AI助手，有什么我可以帮你的吗？'
    }];
    renderMessages();
    loadHistory();
}

// 渲染消息
function renderMessages() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = messages.map(msg => {
        const isUser = msg.role === 'user';
        const content = isUser ? msg.content : renderMarkdown(msg.content);
        return `
            <div class="message ${isUser ? 'user-message' : 'ai-message'}">
                <div class="message-content">
                    ${content}
                    <div class="message-time">${new Date().toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                </div>
                <div class="avatar ${isUser ? 'user-avatar' : 'ai-avatar'}">
                    ${isUser ? 'ME' : 'DS'}
                </div>
            </div>
        `;
    }).join('');
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Markdown 渲染函数
function renderMarkdown(text) {
    // 处理代码块
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(code)}</code></pre>`;
    });

    // 处理行内代码
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 处理粗体
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 处理斜体
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 处理链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // 处理列表
    text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

    // 处理标题
    text = text.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');

    // 处理换行
    text = text.replace(/\n/g, '<br>');

    return text;
}

// HTML 转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 添加消息
function addMessage(content, role) {
    messages.push({ role, content });
    renderMessages();
    saveChat();
}

// 显示打字指示器
function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
        <div class="avatar ai-avatar">DS</div>
    `;
    
    document.getElementById('chatMessages').appendChild(typingDiv);
    return typingDiv;
}

// 移除打字指示器
function removeTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
        typingDiv.parentNode.removeChild(typingDiv);
    }
    isTyping = false;
}

// 发送消息到API
async function sendToAPI(message) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [...messages, { role: 'user', content: message }],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API错误:', error);
        return '抱歉，发生了错误，请稍后再试。';
    }
}

// 处理发送消息
async function handleSend() {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, 'user');
        userInput.value = '';
        
        const typingDiv = showTypingIndicator();
        
        try {
            const response = await sendToAPI(message);
            removeTypingIndicator(typingDiv);
            addMessage(response, 'assistant');
        } catch (error) {
            removeTypingIndicator(typingDiv);
            addMessage('抱歉，发生了错误，请稍后再试。', 'assistant');
        }
    }
}

// 事件监听
document.getElementById('sendButton').addEventListener('click', handleSend);
document.getElementById('userInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSend();
    }
});

// 初始化
loadHistory();
document.getElementById('userInput').focus();