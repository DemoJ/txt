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
const closeSearchBackdrop = document.getElementById('close-search-backdrop');
const searchStatus = document.getElementById('search-status');
const toastContainer = document.getElementById('toast-container');
const toastMessage = document.getElementById('toast-message');
const appHeader = document.getElementById('app-header');
const appDock = document.getElementById('app-dock');

// 格式化工具栏按钮
const btnBold = document.getElementById('btn-bold');
const btnItalic = document.getElementById('btn-italic');
const btnH1 = document.getElementById('btn-h1');
const btnH2 = document.getElementById('btn-h2');
const btnH3 = document.getElementById('btn-h3');
const btnP = document.getElementById('btn-p');
const btnFontPlus = document.getElementById('btn-font-plus');
const btnFontMinus = document.getElementById('btn-font-minus');
const fontSizeDisplay = document.getElementById('font-size-display');
const btnZoomPlus = document.getElementById('btn-zoom-plus');
const btnZoomMinus = document.getElementById('btn-zoom-minus');
const zoomDisplay = document.getElementById('zoom-display');
const downloadTxtBtn = document.getElementById('download-txt');
const downloadMdBtn = document.getElementById('download-md');

// 状态变量
let currentZoom = 100;
const defaultFontSize = 18; // 默认基准字号

// 辅助函数：执行编辑器命令
// 注意：虽然 document.execCommand 已弃用，但在 contenteditable 模式下
// 进行富文本格式化（如加粗、斜体）仍然是目前浏览器兼容性最好的原生方案。
// 对于插入文本和复制等操作，建议使用更现代的 API。
function execCommand(command, value = null) {
    document.execCommand(command, false, value);
    textEditor.focus();
    updateCharCount();
}

// 辅助函数：在光标处插入文本 (替代 execCommand insertText)
function insertTextAtCursor(text) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const fragment = document.createDocumentFragment();
        const lines = text.split(/\r\n|\r|\n/);
        let lastNode = null;

        lines.forEach((line, index) => {
            if (line) {
                const textNode = document.createTextNode(line);
                fragment.appendChild(textNode);
                lastNode = textNode;
            }
            if (index < lines.length - 1) {
                const br = document.createElement('br');
                fragment.appendChild(br);
                lastNode = br;
            }
        });

        if (fragment.hasChildNodes()) {
            range.insertNode(fragment);
            
            // 将光标移动到插入文本的末尾
            if (lastNode) {
                range.setStartAfter(lastNode);
                range.setEndAfter(lastNode);
            }
        }
        
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 触发 input 事件以更新计数等
        textEditor.dispatchEvent(new Event('input'));
    }
}

// 格式化按钮事件监听
btnBold.addEventListener('click', (e) => {
    e.preventDefault();
    execCommand('bold');
});

btnItalic.addEventListener('click', (e) => {
    e.preventDefault();
    execCommand('italic');
});

// 辅助函数：清理指定元素内的行内字号样式
function cleanFontSizeStyles(rootElement) {
    if (!rootElement) return;
    
    // 1. 处理带有 style="font-size:..." 的元素
    const elementsWithStyle = rootElement.querySelectorAll('[style*="font-size"]');
    elementsWithStyle.forEach(el => {
        el.style.fontSize = '';
        if (el.getAttribute('style') === '' || el.getAttribute('style') === null) {
            el.removeAttribute('style');
        }
    });
    
    // 2. 处理 <font size="..."> 标签 (旧式标记)
    const fontTags = rootElement.querySelectorAll('font[size]');
    fontTags.forEach(font => {
        // 解包：将内容移出，删除 font 标签
        while (font.firstChild) {
            font.parentNode.insertBefore(font.firstChild, font);
        }
        font.remove();
    });
}

// 标题格式化
function formatBlock(tag) {
    execCommand('formatBlock', tag);
    
    // 修复：应用标题/段落格式时，强制清除内部的自定义字号
    // 确保 H1/H2 等标题能立即生效为标准的 CSS 样式大小，而不是被之前的内联样式覆盖
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        // 从当前光标位置向上查找最近的块级元素
        let node = selection.anchorNode;
        while (node && node !== textEditor) {
            // 检查是否是块级元素 (H1-H6, P, DIV, LI 等)
            if (node.nodeType === 1 && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV', 'LI', 'BLOCKQUOTE'].includes(node.tagName)) {
                cleanFontSizeStyles(node);
                break; // 只处理当前所在的块
            }
            node = node.parentNode;
        }
    }
    
    // 更新字号显示状态
    setTimeout(updateFontSizeDisplay, 0);
}

btnH1.addEventListener('click', (e) => {
    e.preventDefault();
    formatBlock('H1');
});

btnH2.addEventListener('click', (e) => {
    e.preventDefault();
    formatBlock('H2');
});

btnH3.addEventListener('click', (e) => {
    e.preventDefault();
    formatBlock('H3');
});

btnP.addEventListener('click', (e) => {
    e.preventDefault();
    formatBlock('P');
});

// Zoom 调整 (使用 CSS zoom)
function updateZoom() {
    // 使用 CSS zoom 属性进行整体缩放 (Chrome/Edge/Safari 支持良好)
    // 对于不支持 zoom 的浏览器 (如 Firefox)，可以使用 transform: scale()，这里优先使用 zoom
    textEditor.style.zoom = `${currentZoom}%`;
    zoomDisplay.textContent = `${currentZoom}%`;
}

btnZoomPlus.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentZoom < 200) {
        currentZoom += 10;
        updateZoom();
    }
});

btnZoomMinus.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentZoom > 50) {
        currentZoom -= 10;
        updateZoom();
    }
});

// 字号调整 (针对选区或光标位置)
function getComputedFontSize() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        // 使用 focusNode (光标所在位置) 而不是 anchorNode (选区起始位置)
        // 这样在反向选择时也能正确获取当前位置的字号
        let node = selection.focusNode;
        if (node) {
             if (node.nodeType === 3) node = node.parentNode;
             
             // 确保我们在编辑器内部
             if (textEditor.contains(node) || node === textEditor) {
                 const size = window.getComputedStyle(node).fontSize;
                 return parseInt(size) || defaultFontSize;
             }
        }
    }
    return defaultFontSize;
}

function applyFontSize(size) {
    const selection = window.getSelection();

    // 情况1：光标未选中文字 (Collapsed)
    // 插入一个带有新字号的零宽空格，并将光标置于其后，以便用户接着输入
    if (selection.rangeCount > 0 && selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = `${size}px`;
        span.innerHTML = "&#8203;"; // 零宽空格
        
        range.insertNode(span);
        
        // 将光标移动到零宽空格之后
        range.setStart(span.firstChild, 1);
        range.setEnd(span.firstChild, 1);
        selection.removeAllRanges();
        selection.addRange(range);
        
        updateFontSizeDisplay();
        textEditor.focus();
        return;
    }

    // 情况2：已选中文字
    // 使用 execCommand 'fontSize' 命令生成 <font size="7"> 标记
    // 然后将其替换为 <span style="font-size: ...">
    // 这种方法利用了浏览器的原生选区处理（拆分节点等），避免了复杂的 DOM 操作
    
    // 关键修复：强制关闭 styleWithCSS，确保浏览器生成 <font> 标签而不是 <span style="...">
    // 否则下面的查找替换逻辑会失效，导致无法调整字号
    document.execCommand('styleWithCSS', false, false);
    document.execCommand('fontSize', false, '7');
    
    const fontElements = textEditor.getElementsByTagName("font");
    const newSpans = [];

    // 倒序遍历，因为替换操作会改变集合
    for (let i = fontElements.length - 1; i >= 0; i--) {
        const font = fontElements[i];
        if (font.getAttribute("size") === "7") {
            const span = document.createElement("span");
            span.style.fontSize = `${size}px`;
            
            // 迁移子节点并清理内部的旧字号样式
            while (font.firstChild) {
                const child = font.firstChild;
                span.appendChild(child); // 先移动
                
                // 如果子节点是元素，清理其可能存在的字号样式，确保外层新字号生效
                if (child.nodeType === 1) {
                    // 1. 清理子元素自身的 font-size
                    if (child.style.fontSize) {
                        child.style.fontSize = '';
                        if (!child.getAttribute('style')) child.removeAttribute('style');
                    }
                    // 2. 清理子元素内部的 font-size
                    cleanFontSizeStyles(child);
                }
            }
            
            font.parentNode.replaceChild(span, font);
            newSpans.push(span);
        }
    }

    // 恢复选区
    if (newSpans.length > 0) {
        const newRange = document.createRange();
        // 因为是倒序遍历，newSpans 中的第一个元素实际上是文档中最后的一个
        const firstSpan = newSpans[newSpans.length - 1]; // 文档顺序的第一个
        const lastSpan = newSpans[0]; // 文档顺序的最后一个

        // 关键修复：尝试选中 Span 的内部文本节点，而不是 Span 元素本身
        // 这确保了下一次 getComputedFontSize() 调用时，focusNode 指向文本节点，
        // 从而能通过 parentNode 正确获取到当前 Span 的字号，实现连续调整
        if (firstSpan.firstChild && firstSpan.firstChild.nodeType === 3) {
            newRange.setStart(firstSpan.firstChild, 0);
        } else {
            newRange.setStartBefore(firstSpan);
        }

        if (lastSpan.lastChild && lastSpan.lastChild.nodeType === 3) {
            newRange.setEnd(lastSpan.lastChild, lastSpan.lastChild.length);
        } else {
            newRange.setEndAfter(lastSpan);
        }
        
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
    
    updateFontSizeDisplay();
    textEditor.focus();
}

function updateFontSizeDisplay() {
    const size = getComputedFontSize();
    fontSizeDisplay.textContent = size;
}

btnFontPlus.addEventListener('click', (e) => {
    e.preventDefault(); // 防止失去编辑器焦点
    const current = getComputedFontSize();
    if (current < 72) {
        applyFontSize(current + 2);
    }
});

btnFontMinus.addEventListener('click', (e) => {
    e.preventDefault(); // 防止失去编辑器焦点
    const current = getComputedFontSize();
    if (current > 12) {
        applyFontSize(current - 2);
    }
});

// 监听选区变化以更新字号显示
document.addEventListener('selectionchange', () => {
    // 只有当焦点在编辑器内时才更新
    if (document.activeElement === textEditor || textEditor.contains(document.activeElement)) {
        updateFontSizeDisplay();
    }
});

// 文件下载功能
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

downloadTxtBtn.addEventListener('click', () => {
    const content = textEditor.innerText;
    if (!content.trim()) {
        showToast('文档为空，无法下载');
        return;
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadFile(content, `note-${timestamp}.txt`, 'text/plain');
});

downloadMdBtn.addEventListener('click', () => {
    if (!textEditor.innerText.trim()) {
        showToast('文档为空，无法下载');
        return;
    }

    // 简单的 HTML 转 Markdown (Turndown 库会更好，这里做基础转换)
    let content = textEditor.innerHTML;
    
    // 替换常见标签
    content = content
        .replace(/&nbsp;/g, ' ')
        .replace(/<div><br><\/div>/g, '\n')
        .replace(/<div>/g, '\n')
        .replace(/<\/div>/g, '')
        .replace(/<p>/g, '')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<b>|<strong>/g, '**')
        .replace(/<\/b>|<\/strong>/g, '**')
        .replace(/<i>|<em>/g, '*')
        .replace(/<\/i>|<\/em>/g, '*')
        .replace(/<h1>/g, '# ')
        .replace(/<\/h1>/g, '\n')
        .replace(/<h2>/g, '## ')
        .replace(/<\/h2>/g, '\n')
        .replace(/<h3>/g, '### ')
        .replace(/<\/h3>/g, '\n')
        .replace(/<br>/g, '\n');

    // 去除其他 HTML 标签
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const finalContent = tempDiv.textContent || tempDiv.innerText || "";
    
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadFile(finalContent, `note-${timestamp}.md`, 'text/markdown');
});


// 显示/隐藏搜索面板
function showSearch() {
    searchPanel.classList.remove('hidden');
    findInput.focus();
}

function hideSearch() {
    searchPanel.classList.add('hidden');
    textEditor.focus();
    // 清除高亮 (暂未实现复杂高亮清除)
}

findReplaceBtn.addEventListener('click', showSearch);
closeSearchBtn.addEventListener('click', hideSearch);
closeSearchBackdrop.addEventListener('click', hideSearch);

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !searchPanel.classList.contains('hidden')) {
        hideSearch();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        showSearch();
    }
});

// 简单的查找功能 (使用 window.find)
// 注意：window.find 在非标准场景下可能表现不一致，但对于 contenteditable 足够简单有效
function findText() {
    const searchText = findInput.value;
    if (!searchText) return;
    
    // 聚焦编辑器以便查找
    textEditor.focus();
    
    // 使用浏览器原生查找
    // window.find(aString, aCaseSensitive, aBackwards, aWrapAround, aWholeWord, aSearchInFrames, aShowDialog)
    const found = window.find(searchText, false, false, true, false, false, false);
    
    if (found) {
        updateSearchStatus('找到匹配项');
    } else {
        updateSearchStatus('未找到');
    }
}

findNextBtn.addEventListener('click', findText);

// 替换功能 (基于当前选区)
replaceBtn.addEventListener('click', () => {
    const selection = window.getSelection();
    const searchText = findInput.value;
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const selectedText = selection.toString();
        // 只有当选中的文本确实是我们要查找的文本时才替换
        if (selectedText.toLowerCase() === searchText.toLowerCase()) {
            insertTextAtCursor(replaceInput.value);
            updateSearchStatus('已替换');
            // 查找下一个
            findText();
        } else {
            // 如果当前没选中匹配项，先查找
            findText();
        }
    } else {
        findText();
    }
});

replaceAllBtn.addEventListener('click', () => {
    // 简易实现：获取 HTML，全局替换字符串，再设回去
    // 注意：这会破坏光标位置和可能的事件绑定，但对于简单编辑器尚可接受
    const searchText = findInput.value;
    const replaceText = replaceInput.value;
    
    if (!searchText) return;
    
    // 简单的文本替换，不处理 HTML 标签内的属性等复杂情况
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    
    // 仅在文本节点中替换会比较安全，这里简化处理
    // 遍历所有文本节点进行替换
    const walker = document.createTreeWalker(textEditor, NodeFilter.SHOW_TEXT, null, false);
    let node;
    let count = 0;
    while(node = walker.nextNode()) {
        if (node.nodeValue.includes(searchText)) {
            const newValue = node.nodeValue.replace(regex, replaceText);
            if (newValue !== node.nodeValue) {
                node.nodeValue = newValue;
                count++;
            }
        }
    }
    
    updateSearchStatus(`已替换 ${count} 处`);
    updateCharCount();
});

// 复制全部内容
copyAllBtn.addEventListener('click', () => {
    const content = textEditor.innerText;
    
    // 使用现代 Clipboard API
    navigator.clipboard.writeText(content).then(() => {
        // 反馈
        const originalHtml = copyAllBtn.innerHTML;
        copyAllBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-green-600 dark:text-green-400"></i>';
        lucide.createIcons();
        
        setTimeout(() => {
            copyAllBtn.innerHTML = originalHtml;
            lucide.createIcons();
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败');
    });
});

// 清空内容
clearBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有内容吗？')) {
        textEditor.innerHTML = '';
        localStorage.removeItem('editorContent'); // 清除本地存储
        updateCharCount();
        textEditor.focus();
    }
});

// 主题切换
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDarkMode = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// 更新字符计数
function updateCharCount() {
    const count = textEditor.innerText.replace(/\n/g, '').length;
    charCount.textContent = `${count} 字符`;
}

function updateSearchStatus(text) {
    if (searchStatus) searchStatus.textContent = text;
}

// 辅助函数：显示全局提示 (Toast)
let toastTimeout;
function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastMessage.textContent = message;
    toastContainer.classList.remove('opacity-0', 'translate-y-[-20px]');
    
    toastTimeout = setTimeout(() => {
        toastContainer.classList.add('opacity-0', 'translate-y-[-20px]');
    }, 3000);
}


// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// 初始化应用
function init() {
    initTheme();
    
    // 加载本地存储的内容
    const savedContent = localStorage.getItem('editorContent');
    if (savedContent) {
        textEditor.innerHTML = savedContent;
    }

    updateCharCount();
    updateZoom();
    // 设置初始基准字号
    textEditor.style.fontSize = `${defaultFontSize}px`;
    
    // 监听输入
    textEditor.addEventListener('input', () => {
        updateCharCount();
        // 自动保存内容
        localStorage.setItem('editorContent', textEditor.innerHTML);
    });
    
    // 处理粘贴，尽量只粘贴纯文本
    textEditor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        insertTextAtCursor(text);
    });
}

// 启动
init();
lucide.createIcons();