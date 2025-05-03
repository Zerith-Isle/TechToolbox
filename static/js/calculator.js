// 计算器逻辑保持不变
let currentExpression = '';
let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');

function updateDisplay() {
    document.getElementById('display').value = currentExpression || '0';
}

function inputNumber(num) {
    currentExpression += num;
    updateDisplay();
}

function inputOperator(op) {
    currentExpression += ` ${op} `;
    updateDisplay();
}

function inputFunc(func) {
    currentExpression += `${func}`;
    updateDisplay();
}

function inputConstant(constant) {
    currentExpression += math[constant];
    updateDisplay();
}

function clearEntry() {
    currentExpression = currentExpression.slice(0, -1);
    updateDisplay();
}

function clearAll() {
    currentExpression = '';
    updateDisplay();
}

function calculate() {
    try {
        let expr = currentExpression
            .replace(/mod/g, ' % ')
            .replace(/pow/g, '^')
            .replace(/!/g, '!');

        const result = math.evaluate(expr);
        
        history.push({
            expression: currentExpression,
            result: result,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('calcHistory', JSON.stringify(history));
        currentExpression = result.toString();
        updateDisplay();
        updateHistory();
    } catch (error) {
        currentExpression = '';
        updateDisplay();
        alert(`计算错误: ${error.message}`);
    }
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = history
        .reverse()
        .map((item, index) => `
            <div class="history-item">
                <span class="history-expression">${item.expression} =</span>
                <span class="history-result">${item.result}</span>
            </div>
        `)
        .join('');
}

function clearHistory() {
    history = [];
    localStorage.removeItem('calcHistory');
    updateHistory();
}

function exportHistory() {
    // 获取当前时间作为文件名
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    
    // 准备CSV头部
    const headers = [
        '时间',
        '表达式',
        '结果',
        '计算类型',
        '计算时长(ms)',
        '设备信息',
        '备注'
    ];

    // 处理每条历史记录
    const rows = history.map(item => {
        const calcTime = new Date(item.timestamp);
        const calcType = determineCalcType(item.expression);
        const deviceInfo = getDeviceInfo();
        
        return [
            formatDate(calcTime),
            `"${item.expression}"`,
            `"${item.result}"`,
            `"${calcType}"`,
            '0', // 计算时长（这里可以添加实际计算时间）
            `"${deviceInfo}"`,
            '""' // 备注字段
        ];
    });

    // 创建CSV内容
    const csvContent = [
        headers.join(','),
        ...rows
    ].join('\n');

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `calculator_history_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

// 辅助函数：确定计算类型
function determineCalcType(expression) {
    if (expression.includes('sin(') || expression.includes('cos(') || expression.includes('tan(')) {
        return '三角函数';
    } else if (expression.includes('sqrt(') || expression.includes('^')) {
        return '幂运算';
    } else if (expression.includes('log(')) {
        return '对数运算';
    } else if (expression.includes('π') || expression.includes('e')) {
        return '常数运算';
    } else if (expression.includes('!')) {
        return '阶乘运算';
    } else if (expression.includes('mod')) {
        return '取模运算';
    } else if (expression.includes('+') || expression.includes('-') || 
              expression.includes('*') || expression.includes('/')) {
        return '基本运算';
    } else {
        return '其他运算';
    }
}

// 辅助函数：格式化日期
function formatDate(date) {
    return `"${date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    })}"`;
}

// 辅助函数：获取设备信息
function getDeviceInfo() {
    const ua = navigator.userAgent;
    const screen = window.screen;
    return `设备: ${ua.includes('Mobile') ? '移动设备' : '桌面设备'}, ` +
           `分辨率: ${screen.width}x${screen.height}, ` +
           `浏览器: ${getBrowserName(ua)}`;
}

// 辅助函数：获取浏览器名称
function getBrowserName(ua) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('MSIE') || ua.includes('Trident/')) return 'Internet Explorer';
    return '未知浏览器';
}

document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') inputNumber(e.key);
    if ('+-*/'.includes(e.key)) inputOperator(e.key);
    if (e.key === 'Enter') calculate();
    if (e.key === 'Backspace') clearEntry();
    if (e.key === 'Escape') clearAll();
});

updateHistory();