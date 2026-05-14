(function() {
    const vscode = acquireVsCodeApi();
    const grid = document.getElementById('spreadsheet-grid');
    const searchBox = document.getElementById('searchBox');
    const saveBtn = document.getElementById('saveBtn');
    const gridModeBtn = document.getElementById('gridModeBtn');
    const rawModeBtn = document.getElementById('rawModeBtn');
    const formatBtn = document.getElementById('formatBtn');
    const copyBtn = document.getElementById('copyBtn');
    const supportBtn = document.getElementById('supportBtn');
    const rawEditor = document.getElementById('raw-editor');
    const gridContainer = document.getElementById('grid-container');
    const rawContainer = document.getElementById('raw-container');
    const convertSelect = document.getElementById('convertSelect');

    // Modal elements
    const supportModal = document.getElementById('supportModal');
    const closeModal = supportModal.querySelector('.close-modal');
    const modalCloseBtn = supportModal.querySelector('.modal-close-btn');
    const copyUpi = document.getElementById('copyUpi');

    let gridData = [];
    let originalFormat = 'array';
    let viewMode = 'grid';
    let currentInfo = {};

    // Signal ready to the extension
    vscode.postMessage({ type: 'ready' });

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                gridData = message.data;
                originalFormat = message.originalFormat || 'array';
                currentInfo = message.info || {};
                
                if (viewMode === 'grid') {
                    renderGrid(gridData);
                }
                rawEditor.value = message.raw || '';
                
                if (message.info) {
                    document.getElementById('format-tag').textContent = message.info.type;
                    document.getElementById('row-count').textContent = `${message.info.rows} rows`;
                    
                    // Populate Overview
                    document.getElementById('ov-filename').textContent = message.info.name;
                    document.getElementById('ov-type').textContent = message.info.type;
                    document.getElementById('ov-size').textContent = message.info.size;
                    document.getElementById('ov-rows').textContent = message.info.rows;
                }
                break;
            case 'error':
                showError(message.message);
                break;
        }
    });

    function renderGrid(data) {
        grid.innerHTML = '';
        if (!data || data.length === 0) return;

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        data[0].forEach((cell, colIndex) => {
            const th = document.createElement('th');
            th.innerHTML = `
                <div class="header-content">
                    <span class="header-text">${cell || ''}</span>
                    <button class="col-delete-btn" title="Delete Column">×</button>
                </div>
            `;
            th.querySelector('.col-delete-btn').onclick = () => deleteColumn(colIndex);
            headerRow.appendChild(th);
        });
        
        // Add column button
        const addColTh = document.createElement('th');
        addColTh.className = 'add-col-th';
        addColTh.innerHTML = '<button id="addColumnBtn" title="Add Column">+</button>';
        addColTh.onclick = addColumn;
        headerRow.appendChild(addColTh);
        thead.appendChild(headerRow);
        grid.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        data.slice(1).forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            row.forEach((cell, colIndex) => {
                const td = document.createElement('td');
                td.contentEditable = 'true';
                td.textContent = cell === null || cell === undefined ? '' : cell;
                td.onblur = () => {
                    gridData[rowIndex + 1][colIndex] = td.textContent;
                };
                tr.appendChild(td);
            });
            // Row actions
            const actionTd = document.createElement('td');
            actionTd.className = 'row-action-td';
            actionTd.innerHTML = '<button class="row-delete-btn" title="Delete Row">×</button>';
            actionTd.querySelector('.row-delete-btn').onclick = () => deleteRow(rowIndex + 1);
            tr.appendChild(actionTd);
            tbody.appendChild(tr);
        });
        
        // Add row button
        const addRowTr = document.createElement('tr');
        const addRowTd = document.createElement('td');
        addRowTd.colSpan = data[0].length + 1;
        addRowTd.className = 'add-row-td';
        addRowTd.innerHTML = '<button id="addRowBtn">+ Add Row</button>';
        addRowTd.onclick = addRow;
        addRowTr.appendChild(addRowTd);
        tbody.appendChild(addRowTr);
        
        grid.appendChild(tbody);
    }

    // Mode Switching
    gridModeBtn.onclick = () => {
        if (viewMode === 'grid') return;
        viewMode = 'grid';
        gridModeBtn.classList.add('active');
        rawModeBtn.classList.remove('active');
        gridContainer.classList.remove('hidden');
        rawContainer.classList.add('hidden');
        renderGrid(gridData);
    };

    rawModeBtn.onclick = () => {
        if (viewMode === 'raw') return;
        viewMode = 'raw';
        rawModeBtn.classList.add('active');
        gridModeBtn.classList.remove('active');
        rawContainer.classList.remove('hidden');
        gridContainer.classList.add('hidden');
    };

    // Toolbar Actions
    saveBtn.onclick = () => {
        if (viewMode === 'grid') {
            vscode.postMessage({ type: 'save', data: gridData, originalFormat: originalFormat });
        } else {
            vscode.postMessage({ type: 'saveRaw', content: rawEditor.value });
        }
    };

    formatBtn.onclick = () => {
        const content = rawEditor.value;
        try {
            if (currentInfo.type === 'JSON') {
                rawEditor.value = JSON.stringify(JSON.parse(content), null, 4);
            } else if (currentInfo.type === 'XML') {
                let formatted = '';
                let reg = /(>)(<)(\/*)/g;
                let xml = content.replace(reg, '$1\r\n$2$3');
                let pad = 0;
                xml.split('\r\n').forEach(node => {
                    let indent = 0;
                    if (node.match(/.+<\/\w[^>]*>$/)) indent = 0;
                    else if (node.match(/^<\/\w/)) { if (pad != 0) pad -= 1; }
                    else if (node.match(/^<\w[^>]*[^\/]>.*$/)) indent = 1;
                    else indent = 0;
                    let padding = '';
                    for (let i = 0; i < pad; i++) padding += '  ';
                    formatted += padding + node + '\r\n';
                    pad += indent;
                });
                rawEditor.value = formatted.trim();
            }
        } catch (e) {
            showError('Could not format: Invalid syntax');
        }
    };

    copyBtn.onclick = () => {
        rawEditor.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    };

    // Support & Overview Modal Logic
    const overviewBtn = document.getElementById('overviewBtn');
    const overviewModal = document.getElementById('overviewModal');

    function setupModal(modal, btn) {
        if (!modal || !btn) return;
        const closeBtns = modal.querySelectorAll('.close-modal, .modal-close-btn');
        btn.onclick = () => modal.classList.remove('hidden');
        closeBtns.forEach(b => b.onclick = () => modal.classList.add('hidden'));
    }

    setupModal(supportModal, supportBtn);
    setupModal(overviewModal, overviewBtn);

    if (copyUpi) {
        copyUpi.onclick = () => {
            const upiText = document.getElementById('upiId').textContent;
            navigator.clipboard.writeText(upiText);
            copyUpi.textContent = 'Copied!';
            setTimeout(() => copyUpi.textContent = 'Copy', 2000);
        };
    }

    // Conversion Logic
    convertSelect.onchange = () => {
        const targetFormat = convertSelect.value;
        if (!targetFormat) return;
        
        // Notify backend to convert
        vscode.postMessage({ 
            type: 'convert', 
            target: targetFormat, 
            data: gridData 
        });
        
        convertSelect.value = ''; // Reset
    };

    // Helper Functions
    function addRow() {
        const newRow = new Array(gridData[0].length).fill('');
        gridData.push(newRow);
        renderGrid(gridData);
    }

    function addColumn() {
        const colName = prompt('Enter column name:');
        if (colName) {
            gridData[0].push(colName);
            for (let i = 1; i < gridData.length; i++) {
                gridData[i].push('');
            }
            renderGrid(gridData);
        }
    }

    function deleteRow(index) {
        gridData.splice(index, 1);
        renderGrid(gridData);
    }

    function deleteColumn(index) {
        gridData.forEach(row => row.splice(index, 1));
        renderGrid(gridData);
    }

    searchBox.oninput = () => {
        const term = searchBox.value.toLowerCase();
        const rows = grid.querySelectorAll('tbody tr');
        rows.forEach((row, i) => {
            if (row.querySelector('.add-row-td')) return;
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    };

    function showError(msg) {
        const errDiv = document.createElement('div');
        errDiv.className = 'error-banner glass';
        errDiv.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 12px 24px; border-radius: 12px; z-index: 1000; box-shadow: 0 8px 32px rgba(0,0,0,0.3);';
        errDiv.textContent = msg;
        document.body.appendChild(errDiv);
        setTimeout(() => errDiv.remove(), 5000);
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveBtn.click();
        }
    });

})();
