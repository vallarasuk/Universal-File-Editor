import * as Papa from 'papaparse';
import * as yaml from 'js-yaml';
import { XMLParser } from 'fast-xml-parser';

async function testFormats() {
    console.log('🚀 Starting Universal Format Validation Test...');
    const results: any[] = [];

    const samples = [
        { ext: '.csv', content: 'id,name,active\n1,Test,true\n2,Demo,false' },
        { ext: '.json', content: JSON.stringify([{ id: 1, name: 'Test' }, { id: 2, name: 'Demo', extra: 'field' }]) },
        { ext: '.jsonl', content: '{"id":1}\n{"id":2}' },
        { ext: '.xml', content: '<root><item><id>1</id><name>Test</name></item><item><id>2</id><name>Demo</name></item></root>' },
        { ext: '.yaml', content: '- id: 1\n  name: Test\n- id: 2\n  name: Demo' }
    ];

    for (const sample of samples) {
        try {
            let data: any[][] = [];
            const ext = sample.ext;
            const content = sample.content;

            if (ext === '.csv') {
                const res = Papa.parse(content);
                data = res.data as any[][];
            } else if (ext === '.json' || ext === '.jsonl') {
                let parsed;
                if (ext === '.jsonl') {
                    parsed = content.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
                } else {
                    parsed = JSON.parse(content);
                    if (!Array.isArray(parsed)) parsed = [parsed];
                }
                const keys = new Set<string>();
                parsed.forEach((obj: any) => Object.keys(obj).forEach(k => keys.add(k)));
                const headers = Array.from(keys);
                data = [headers, ...parsed.map((obj: any) => headers.map(h => obj[h]))];
            } else if (ext === '.xml') {
                const parser = new XMLParser();
                const jsonObj = parser.parse(content);
                const key = Object.keys(jsonObj)[0];
                const items = Array.isArray(jsonObj[key]) ? jsonObj[key] : [jsonObj[key]];
                const keys = Object.keys(items[0]);
                data = [keys, ...items.map((item: any) => keys.map(k => item[k]))];
            } else if (ext === '.yaml') {
                const parsed = yaml.load(content) as any[];
                const keys = Object.keys(parsed[0]);
                data = [keys, ...parsed.map((obj: any) => keys.map(k => obj[k]))];
            }

            console.log(`✅ [${ext}] Parsed successfully. Rows: ${data.length}`);
            results.push({ ext, status: 'PASS', rows: data.length });
        } catch (e: any) {
            console.error(`❌ [${sample.ext}] Failed:`, e.message);
            results.push({ ext: sample.ext, status: 'FAIL', error: e.message });
        }
    }

    console.table(results);
    if (results.some(r => r.status === 'FAIL')) {
        process.exit(1);
    }
    console.log('🎉 All formats validated successfully!');
}

testFormats();
