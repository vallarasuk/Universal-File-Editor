(function() {
    const vscode = acquireVsCodeApi();
    const grid = document.getElementById('spreadsheet-grid');
    const searchBox = document.getElementById('searchBox');

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                renderGrid(message.data);
                break;
            case 'error':
                showError(message.message);
                break;
        }
    });

    function showError(msg) {
        grid.innerHTML = `<tr><td style="color: #ff4444; text-align: center; padding: 40px;">⚠️ ${msg}</td></tr>`;
    }

    function renderGrid(data) {
        grid.innerHTML = '';
        if (!data || data.length === 0) {
            grid.innerHTML = '<tr><td style="text-align: center; padding: 40px;">No data found.</td></tr>';
            return;
        }

        const headerRow = document.createElement('tr');
        data[0].forEach((cell, i) => {
            const th = document.createElement('th');
            th.textContent = cell || '';
            th.contentEditable = true;
            headerRow.appendChild(th);
        });
        grid.appendChild(headerRow);

        data.slice(1).forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                if (typeof cell === 'boolean' || (typeof cell === 'string' && (cell.toLowerCase() === 'true' || cell.toLowerCase() === 'false'))) {
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = cell === true || cell.toString().toLowerCase() === 'true';
                    td.appendChild(cb);
                } else {
                    td.textContent = cell || '';
                }
                td.contentEditable = true;
                tr.appendChild(td);
            });
            grid.appendChild(tr);
        });
    }

    searchBox.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = grid.querySelectorAll('tr:not(:first-child)');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });

    let debounceTimer;
    grid.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            sendUpdate();
        }, 300);
    });

    function sendUpdate() {
        const data = [];
        const rows = grid.querySelectorAll('tr');
        rows.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('th, td');
            cells.forEach(cell => {
                const cb = cell.querySelector('input[type="checkbox"]');
                if (cb) {
                    rowData.push(cb.checked);
                } else {
                    rowData.push(cell.textContent);
                }
            });
            data.push(rowData);
        });
        vscode.postMessage({
            type: 'save', // We reuse the save message for real-time sync
            data: data
        });
    }

    document.getElementById('saveBtn').addEventListener('click', () => {
        sendUpdate();
    });

    // Handle focus and selection
    grid.addEventListener('click', (e) => {
        if (e.target.tagName === 'TD' || e.target.tagName === 'TH') {
            e.target.focus();
        }
    });
})();
