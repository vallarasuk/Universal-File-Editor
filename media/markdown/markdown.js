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
        }, 300);
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
                preview.innerHTML = message.content;
                break;
        }
    });

    // Formatting commands
    document.getElementById('boldBtn').addEventListener('click', () => document.execCommand('bold'));
    document.getElementById('italicBtn').addEventListener('click', () => document.execCommand('italic'));
})();
