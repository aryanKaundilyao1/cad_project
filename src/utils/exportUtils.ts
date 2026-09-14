// Export utilities for CRM data

/**
 * Export an array of objects as a CSV file download.
 * Pure JS — no dependencies.
 */
export function exportToCSV(data: Record<string, any>[], filename: string = 'export.csv') {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h] ?? '';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Export an array of objects as an Excel (.xlsx) file download.
 * Uses the xlsx library.
 */
export async function exportToExcel(data: Record<string, any>[], filename: string = 'export.xlsx') {
  if (!data.length) return;

  // Dynamically import xlsx to keep bundle lean
  const XLSX = await import('xlsx');

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  // Auto-fit column widths
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(
      key.length,
      ...data.map(row => String(row[key] ?? '').length)
    ) + 2,
  }));
  worksheet['!cols'] = colWidths;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, filename);
}

/**
 * Copy a lead's data to clipboard in a formatted string.
 */
export function copyLeadToClipboard(lead: Record<string, any>) {
  const text = Object.entries(lead)
    .filter(([key]) => !['id', 'assigned_to', 'assigned_by', 'created_at', 'updated_at'].includes(key))
    .map(([key, value]) => `${key}: ${value ?? '—'}`)
    .join('\n');

  navigator.clipboard.writeText(text);
}

/**
 * Parse a CSV string into an array of objects using the first row as headers.
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineStr = lines[i].trim();
    if (!lineStr) continue; // ignore empty lines
    
    const values = parseCSVRow(lines[i]);
    // Ignore completely blank rows
    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const headerName = h.trim() || `Column_${idx + 1}`;
      row[headerName] = (values[idx] || '').trim();
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Standardize an arbitrary CSV row into a canonical Lead structure.
 * Puts all unmatched/extra columns into a metadata JSON object.
 */
export function standardizeLeadRow(row: Record<string, string>) {
  // Normalize row keys
  const normalizedRow: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key || key.startsWith('_EMPTY')) continue;
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    normalizedRow[normKey] = value;
  }

  const getRowVal = (keys: string[]) => {
    for (const k of keys) {
      const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedRow[normK] && normalizedRow[normK].trim() !== '') return normalizedRow[normK].trim();
    }
    return '';
  };

  const title = getRowVal(['Project Name', 'title', 'Title', 'requirement', 'Requirement Title', 'Lead Name', 'Lead Title', 'Name', 'Requirement']);
  const description = getRowVal(['Project Description', 'description', 'Description', 'details', 'Full Description', 'Requirement Details', 'Details']);
  const company_name = getRowVal(['Promoter Company Name', 'company_name', 'company', 'Company', 'Organization', 'Client', 'Buyer']);
  const contact_name = getRowVal(['contact_name', 'contact', 'name', 'Name', 'Contact Person', 'Person Name', 'Contact']);
  const email = getRowVal(['Promoter Office Email', 'email', 'Email', 'Email Address', 'Mail']);
  const phone = getRowVal(['Promoter Telephone', 'phone', 'Phone', 'Phone Number', 'Mobile', 'Contact Number']);
  const website = getRowVal(['website', 'Website', 'URL', 'Link']);
  const industry = getRowVal(['Industry', 'category', 'industry', 'Category', 'Domain', 'Sector']);
  const niche = getRowVal(['Niche', 'niche']);
  const sub_niche = getRowVal(['Sub Niche', 'sub_niche', 'Sub-niche']);
  const location = getRowVal(['location', 'Location', 'Address', 'Place']);
  const city = getRowVal(['city', 'City', 'District']);
  const state = getRowVal(['state', 'State', 'Region']);
  const country = getRowVal(['country', 'Country']);
  const budget = getRowVal(['budget', 'Budget', 'budget_max', 'Budget Max', 'Max Budget']);
  const budget_min = getRowVal(['budget_min', 'Budget Min', 'Min Budget']);
  const timeline = getRowVal(['timeline', 'Timeline', 'Timeframe', 'Deadline']);
  const tags = getRowVal(['tags', 'Tags', 'Keywords']);
  const total_area = getRowVal(['total_area', 'area', 'Area', 'SqFt', 'Size']);

  const knownKeys = [
    'Project Name', 'title', 'Title', 'requirement', 'Requirement Title', 'Lead Name', 'Lead Title', 'Name', 'Requirement',
    'Project Description', 'description', 'Description', 'details', 'Full Description', 'Requirement Details', 'Details',
    'Promoter Company Name', 'company_name', 'company', 'Company', 'Organization', 'Client', 'Buyer',
    'contact_name', 'contact', 'name', 'Name', 'Contact Person', 'Person Name', 'Contact',
    'Promoter Office Email', 'email', 'Email', 'Email Address', 'Mail',
    'Promoter Telephone', 'phone', 'Phone', 'Phone Number', 'Mobile', 'Contact Number',
    'website', 'Website', 'URL', 'Link',
    'Industry', 'category', 'industry', 'Category', 'Domain', 'Sector',
    'Niche', 'niche', 'Sub Niche', 'sub_niche', 'Sub-niche',
    'location', 'Location', 'Address', 'Place', 'city', 'City', 'District', 'state', 'State', 'Region', 'country', 'Country',
    'budget', 'Budget', 'budget_max', 'Budget Max', 'Max Budget', 'budget_min', 'Budget Min', 'Min Budget',
    'timeline', 'Timeline', 'Timeframe', 'Deadline', 'tags', 'Tags', 'Keywords',
    'total_area', 'area', 'Area', 'SqFt', 'Size'
  ];

  const knownKeysNormalized = knownKeys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key || key.startsWith('_EMPTY')) continue;
    const normK = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!knownKeysNormalized.includes(normK)) {
      metadata[key] = value;
    }
  }

  // Derive a fallback location if location is empty
  let finalLocation = location;
  if (!finalLocation) {
    const parts = [city, state, country].filter(Boolean);
    finalLocation = parts.length > 0 ? parts.join(', ') : 'India';
  }

  return {
    title: title || 'Untitled Requirement',
    description: description || null,
    company_name: company_name || null,
    contact_name: contact_name || null,
    email: email || null,
    phone: phone || null,
    website: website || null,
    industry: industry || null,
    niche: niche || null,
    sub_niche: sub_niche || null,
    location: finalLocation,
    city: city || null,
    state: state || null,
    country: country || null,
    budget_min: budget_min ? Number(budget_min) : null,
    budget_max: budget ? Number(budget) : null,
    timeline: timeline || null,
    tags: tags || null,
    total_area: total_area ? Number(total_area) : null,
    metadata
  };
}
