// 获取DOM元素
const textEditor = document.getElementById('text-editor');
const copyAllBtn = document.getElementById('copy-all');
const clearBtn = document.getElementById('clear');
const findReplaceBtn = document.getElementById('find-replace');
const themeToggle = document.getElementById('theme-toggle');
const charCount = document.getElementById('char-count');
const searchPanel = document.getElementById('search-panel');
const findInput = document.getElementById('find-input');
const replaceInput = document.getElementById('replace-input');
const findNextBtn = document.getElementById('find-next');
const replaceBtn = document.getElementById('replace-btn');
const replaceAllBtn = document.getElementById('replace-all');
const closeSearchBtn = document.getElementById('close-search');
const searchStatus = document.getElementById('search-status');

// 搜索替换相关变量
let currentMatchIndex = -1;
let matches = [];

// 显示/隐藏搜索面板
findReplaceBtn.addEventListener('click', () => {
    searchPanel.classList.add('active');
    findInput.focus();
});

closeSearchBtn.addEventListener('click', () => {
    searchPanel.classList.remove('active');
    textEditor.focus();
});

// 查找文本
function findText() {
    const searchText = findInput.value;
    if (!searchText) {
        searchStatus.textContent = '请输入查找内容';
        return;
    }
    
    const text = textEditor.value;
    matches = [];
    let startIndex = 0;
    
    // 查找所有匹配项
    while (startIndex < text.length) {
        const index = text.indexOf(searchText, startIndex);
        if (index === -1) break;
        
        matches.push({
            start: index,
            end: index + searchText.length
        });
        
        startIndex = index + searchText.length;
    }
    
    if (matches.length === 0) {
        searchStatus.textContent = '未找到匹配项';
        currentMatchIndex = -1;
        return;
    }
    
    currentMatchIndex = 0;
    highlightCurrentMatch();
}

// 高亮当前匹配项
function highlightCurrentMatch() {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
    
    const match = matches[currentMatchIndex];
    textEditor.focus();
    textEditor.setSelectionRange(match.start, match.end);
    textEditor.scrollTop = textEditor.scrollHeight * (match.start / textEditor.value.length);
    
    searchStatus.textContent = `找到 ${matches.length} 个匹配项 (${currentMatchIndex + 1}/${matches.length})`;
}

// 查找下一个
findNextBtn.addEventListener('click', () => {
    // 文本更新后需要重新搜索
    if (matches.length === 0) {
        findText();
        return;
    }
    
    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
    highlightCurrentMatch();
});

// 替换当前匹配项
replaceBtn.addEventListener('click', () => {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;
    
    const match = matches[currentMatchIndex];
    const text = textEditor.value;
    const before = text.substring(0, match.start);
    const after = text.substring(match.end);
    
    textEditor.value = before + replaceInput.value + after;
    
    // 更新匹配位置（因为文本长度可能变化）
    const lengthDiff = replaceInput.value.length - (match.end - match.start);
    matches.forEach((m, i) => {
        if (m.start > match.start) {
            m.start += lengthDiff;
            m.end += lengthDiff;
        }
    });
    
    // 移除当前匹配项
    matches.splice(currentMatchIndex, 1);
    
    if (matches.length === 0) {
        searchStatus.textContent = '替换完成，无更多匹配项';
        currentMatchIndex = -1;
    } else {
        currentMatchIndex = Math.min(currentMatchIndex, matches.length - 1);
        highlightCurrentMatch();
    }
    
    updateCharCount();
});

// 全部替换
replaceAllBtn.addEventListener('click', () => {
    const searchText = findInput.value;
    if (!searchText) return;
    
    const replaceText = replaceInput.value;
    textEditor.value = textEditor.value.split(searchText).join(replaceText);
    
    searchStatus.textContent = `已替换所有匹配项 (${matches.length} 处)`;
    matches = [];
    currentMatchIndex = -1;
    
    updateCharCount();
});

// 复制全部内容
copyAllBtn.addEventListener('click', () => {
    textEditor.select();
    try {
        navigator.clipboard.writeText(textEditor.value)
            .then(() => {
                // 显示成功反馈
                const originalText = copyAllBtn.textContent;
                copyAllBtn.textContent = '已复制!';
                setTimeout(() => {
                    copyAllBtn.textContent = originalText;
                }, 2000);
            });
    } catch (err) {
        console.error('复制失败:', err);
    }
});

// 清空内容
clearBtn.addEventListener('click', () => {
    textEditor.value = '';
    updateCharCount();
    textEditor.focus();
});

// 主题切换
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDarkMode ? '浅色模式' : '深色模式';
    
    // 保存主题偏好
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// 更新字符计数
function updateCharCount() {
    const count = textEditor.value.length;
    charCount.textContent = `${count} 字符`;
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '浅色模式';
    }
}

// 初始化应用
function init() {
    initTheme();
    updateCharCount();
    
    // 监听文本输入
    textEditor.addEventListener('input', () => {
        updateCharCount();
        // 文本更新后重置匹配状态
        matches = [];
        currentMatchIndex = -1;
    });

    // 监听查找输入框的变化
    findInput.addEventListener('input', () => {
        matches = [];
        currentMatchIndex = -1;
        searchStatus.textContent = '';
    });
}

// 调用初始化函数
init();