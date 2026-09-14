export class CsvGenerator {
  static generateTemplate(template: any) {
    if (!template) return;
    
    let headers: string[] = [];
    
    if (template.fields && Array.isArray(template.fields) && template.fields.length > 0) {
      headers = template.fields.map((f: any) => f.key);
    } else {
      const required = template.required_fields || [];
      const optional = template.optional_fields || [];
      headers = [...required, ...optional];
    }
    
    if (headers.length === 0) return;

    const csvContent = headers.join(',') + '\\n';
    
    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${template.template_name.replace(/\\s+/g, '_')}_Template.csv`);
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
