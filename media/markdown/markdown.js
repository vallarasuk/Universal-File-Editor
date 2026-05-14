(function() {
    const vscode = acquireVsCodeApi();
    const preview = document.getElementById('preview');

    // Make preview editable
    preview.setAttribute('contenteditable', 'true');

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

