(function() {
    const vscode = acquireVsCodeApi();
    const preview = document.getElementById('preview');

    // Make preview editable
    preview.setAttribute('contenteditable', 'true');

    // Signal ready
    vscode.postMessage({ type: 'ready' });

    let debounceTimer;
    preview.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            sendUpdate();
        }, 500);
    });

    function sendUpdate() {
        vscode.postMessage({
            type: 'save',
            content: preview.innerHTML
        });
    }

    document.getElementById('saveBtn').addEventListener('click', () => {
        sendUpdate();
    });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                // Only update if not focused to avoid cursor jumping
                if (document.activeElement !== preview) {
                    preview.innerHTML = message.content;
                }
                break;
        }
    });

    // Formatting commands
    const exec = (cmd, val = null) => {
        document.execCommand(cmd, false, val);
        preview.focus();
        sendUpdate();
    };

    document.getElementById('boldBtn').addEventListener('click', () => exec('bold'));
    document.getElementById('italicBtn').addEventListener('click', () => exec('italic'));
    document.getElementById('strikeBtn').addEventListener('click', () => exec('strikeThrough'));
    document.getElementById('h1Btn').addEventListener('click', () => exec('formatBlock', 'H1'));
    document.getElementById('h2Btn').addEventListener('click', () => exec('formatBlock', 'H2'));
    document.getElementById('h3Btn').addEventListener('click', () => exec('formatBlock', 'H3'));
    document.getElementById('listBtn').addEventListener('click', () => exec('insertUnorderedList'));
    document.getElementById('numListBtn').addEventListener('click', () => exec('insertOrderedList'));
    document.getElementById('codeBtn').addEventListener('click', () => exec('formatBlock', 'PRE'));

    // Handle Tab key in code blocks
    preview.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }
    });
})();


// Support Modal Logic
const supportBtn = document.getElementById('supportBtn');
const supportModal = document.getElementById('supportModal');
const closeModal = supportModal.querySelector('.close-modal');
const modalCloseBtn = supportModal.querySelector('.modal-close-btn');
const copyUpi = document.getElementById('copyUpi');

if (supportBtn) {
    supportBtn.onclick = () => supportModal.classList.remove('hidden');
    closeModal.onclick = () => supportModal.classList.add('hidden');
    modalCloseBtn.onclick = () => supportModal.classList.add('hidden');
    copyUpi.onclick = () => {
        navigator.clipboard.writeText('vallarasuk143@pingpay');
        copyUpi.textContent = 'Copied!';
        setTimeout(() => copyUpi.textContent = 'Copy', 2000);
    };
}
