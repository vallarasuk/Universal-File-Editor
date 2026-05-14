(function() {
    const vscode = acquireVsCodeApi();
    const grid = document.getElementById('spreadsheet-grid');
    const searchBox = document.getElementById('searchBox');
    const saveBtn = document.getElementById('saveBtn');
    
    let gridData = [];
    let originalFormat = 'array';

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                gridData = message.data;
                originalFormat = message.originalFormat || 'array';
                renderGrid(gridData);
                if (message.info) {
                    document.getElementById('format-tag').textContent = message.info.type;
                    document.getElementById('row-count').textContent = `${message.info.rows} rows`;
                }
                break;
            case 'error':
                showError(message.message);
                break;
        }
    });

    function showError(msg) {
        grid.innerHTML = `<tr><td style="color: #ff4444; text-align: center; padding: 40px; font-weight: 500;">⚠️ ${msg}</td></tr>`;
    }

    function renderGrid(data) {
        grid.innerHTML = '';
        if (!data || data.length === 0) {
            grid.innerHTML = '<tr><td style="text-align: center; padding: 40px; opacity: 0.6;">No data found. Start by adding a row.</td></tr>';
            return;
        }

        const headerRow = document.createElement('tr');
        data[0].forEach((cell, i) => {
            const th = document.createElement('th');
            th.className = 'glass';
            th.innerHTML = `
                <div class="header-content">
                    <span contenteditable="true">${cell || ''}</span>
                    <button class="col-delete-btn" title="Delete Column">×</button>
                </div>
            `;
            
            const span = th.querySelector('span');
            span.addEventListener('blur', () => {
                gridData[0][i] = span.textContent;
                sendUpdate();
            });

            th.querySelector('.col-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteColumn(i);
            });

            headerRow.appendChild(th);
        });
        grid.appendChild(headerRow);

        data.slice(1).forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            row.forEach((cell, colIndex) => {
                const td = document.createElement('td');
                if (typeof cell === 'boolean' || (typeof cell === 'string' && (cell.toLowerCase() === 'true' || cell.toLowerCase() === 'false'))) {
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = cell === true || cell.toString().toLowerCase() === 'true';
                    cb.addEventListener('change', () => {
                        gridData[rowIndex + 1][colIndex] = cb.checked;
                        sendUpdate();
                    });
                    td.appendChild(cb);
                } else {
                    td.textContent = cell || '';
                    td.contentEditable = true;
                    td.addEventListener('blur', () => {
                        gridData[rowIndex + 1][colIndex] = td.textContent;
                        sendUpdate();
                    });
                }
                tr.appendChild(td);
            });
            
            // Add row delete button
            const deleteTd = document.createElement('td');
            deleteTd.className = 'row-action';
            deleteTd.innerHTML = '<button class="row-delete-btn" title="Delete Row">×</button>';
            deleteTd.querySelector('button').addEventListener('click', () => deleteRow(rowIndex + 1));
            tr.appendChild(deleteTd);

            grid.appendChild(tr);
        });
    }

    function deleteRow(index) {
        gridData.splice(index, 1);
        renderGrid(gridData);
        sendUpdate();
    }

    function deleteColumn(index) {
        gridData.forEach(row => {
            row.splice(index, 1);
        });
        renderGrid(gridData);
        sendUpdate();
    }

    function addRow() {
        if (gridData.length === 0) {
            gridData = [['New Column']];
        }
        const newRow = new Array(gridData[0].length).fill('');
        gridData.push(newRow);
        renderGrid(gridData);
        sendUpdate();
    }

    function addColumn() {
        if (gridData.length === 0) {
            gridData = [['New Column'], ['']];
            renderGrid(gridData);
            sendUpdate();
            return;
        }
        gridData[0].push(`Column ${gridData[0].length + 1}`);
        for (let i = 1; i < gridData.length; i++) {
            gridData[i].push('');
        }
        renderGrid(gridData);
        sendUpdate();
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
    function sendUpdate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            vscode.postMessage({
                type: 'save',
                data: gridData,
                originalFormat: originalFormat
            });
        }, 500);
    }

    saveBtn.addEventListener('click', () => {
        vscode.postMessage({
            type: 'save',
            data: gridData,
            originalFormat: originalFormat
        });
    });

    // Toolbar buttons for row/col management
    const addRowBtn = document.createElement('button');
    addRowBtn.textContent = '+ Row';
    addRowBtn.addEventListener('click', addRow);
    
    const addColBtn = document.createElement('button');
    addColBtn.textContent = '+ Column';
    addColBtn.addEventListener('click', addColumn);

    const toolbar = document.getElementById('toolbar');
    toolbar.insertBefore(addRowBtn, searchBox);
    toolbar.insertBefore(addColBtn, searchBox);

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            vscode.postMessage({ type: 'save', data: gridData });
        }
    });
})();

