// 調試用的示例資料 - 請貼上您的實際表格資料來測試解析功能
const content = `| 日期＋檔案名稱 | 說明 | GitHub | vercel | 路徑 | 狀態備註 |
| --- | --- | --- | --- | --- | --- |
| 示例項目 | ［重要］測試項目 | [**github-repo**](https://github.com/example/repo) | [vercel-app](https://vercel.com/example) | C:\項目 | 測試中 |
| 空日期項目 | ［次］副項目 | [**github-repo-2**](https://github.com/example/repo2) |  | D:\開發 | 進行中 |
`;

function parseProjectTable(text) {
  const lines = text.split('\n');
  const rowStrings = [];
  let currentRow = null;

  console.log('=== DEBUG: Raw input lines ===');
  lines.forEach((line, i) => {
    console.log(`Line ${i}: "${line}"`);
  });

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trimEnd();
    if (!trimmedLine.trim()) continue;

    if (trimmedLine.trimStart().startsWith('|')) {
      if (currentRow) {
        rowStrings.push(currentRow);
        console.log(`Added row: "${currentRow}"`);
      }
      currentRow = trimmedLine;
    } else if (currentRow) {
      currentRow += ` ${trimmedLine}`;
      console.log(`Extended row: "${currentRow}"`);
    }
  }

  if (currentRow) {
    rowStrings.push(currentRow);
    console.log(`Added final row: "${currentRow}"`);
  }

  console.log('\n=== DEBUG: Final row strings ===');
  rowStrings.forEach((row, i) => {
    console.log(`Row ${i}: "${row}"`);
  });

  const extractUrl = (value) => {
    const trimmed = value ? value.trim() : '';
    if (!trimmed || trimmed === 'undefined') return '';
    if (trimmed.includes('無') || trimmed.includes('未部屬')) return '';

    const boldMatch = trimmed.match(/\*\*\[.*?\]\*\*\((.*?)\)/);
    if (boldMatch) return boldMatch[1];

    const markdownMatch = trimmed.match(/\[.*?\]\((.*?)\)/);
    if (markdownMatch) return markdownMatch[1];

    return trimmed;
  };

  const projects = [];

  console.log('\n=== DEBUG: Processing rows ===');
  for (let i = 0; i < rowStrings.length; i++) {
    const row = rowStrings[i];
    console.log(`\nProcessing row ${i}: "${row}"`);

    if (!row.includes('|')) {
      console.log('Skipping: no pipe characters');
      continue;
    }
    if (row.includes('|---') || row.includes('日期＋檔案名稱')) {
      console.log('Skipping: header or separator');
      continue;
    }

    const rawColumns = row.split('|');
    console.log('Raw columns after split:', rawColumns);

    if (rawColumns[0] === '') {
      rawColumns.shift();
      console.log('Shifted first empty column');
    }
    if (rawColumns.length && rawColumns[rawColumns.length - 1].trim() === '') {
      rawColumns.pop();
      console.log('Popped last empty column');
    }

    const columns = rawColumns.map(col => col.trim());
    console.log('Final columns:', columns);

    if (columns.every(col => !col)) {
      console.log('Skipping: all columns empty');
      continue;
    }

    while (columns.length < 6) {
      columns.push('');
    }

    const [
      dateFileName = '',
      description = '',
      github = '',
      vercel = '',
      path = '',
      statusNote = '',
      ...extraColumns
    ] = columns;

    console.log('Extracted fields:');
    console.log('- dateFileName:', `"${dateFileName}"`);
    console.log('- description:', `"${description}"`);
    console.log('- github:', `"${github}"`);
    console.log('- vercel:', `"${vercel}"`);
    console.log('- path:', `"${path}"`);
    console.log('- statusNote:', `"${statusNote}"`);

    if (!description.trim()) {
      console.log('Skipping: no description');
      continue;
    }

    const combinedStatusNote = [statusNote, ...extraColumns]
      .filter(Boolean)
      .join(' ');

    const project = {
      dateAndFileName: dateFileName.trim(),
      description: description.trim(),
      github: extractUrl(github),
      vercel: extractUrl(vercel),
      path: path && path !== 'undefined' ? path.trim() : '',
      statusNote: combinedStatusNote && combinedStatusNote !== 'undefined' ? combinedStatusNote.trim() : ''
    };

    console.log('Created project:', project);
    projects.push(project);
  }

  console.log('\n=== FINAL RESULT ===');
  console.log(`Total projects found: ${projects.length}`);
  projects.forEach((project, i) => {
    console.log(`Project ${i + 1}:`, project);
  });

  return projects;
}

console.log('Starting parse...');
const result = parseProjectTable(content);
console.log('\nFinal projects count:', result.length);
