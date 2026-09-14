import fs from 'fs';

const path = 'src/pages/LeadDetailPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to inject additional field extraction
const targetStr = `  // Additional Information`;
const newFields = `
  // Financial & Corporate
  const revenue = meta.revenue || meta.annual_revenue || meta.estimated_revenue || '';
  const employees = meta.employees || meta.employee_count || meta.company_size || '';
  const founded = meta.founded || meta.year_founded || meta.founded_year || '';
  const certifications = meta.certifications || meta.iso_certifications || '';
  const brands = meta.brands || meta.product_brands || '';
  
  // Additional Information`;
  
if (content.includes(targetStr)) {
  content = content.replace(targetStr, newFields);
  
  // Also add them to usedKeys so they don't show up in raw metadata
  content = content.replace(
    `'oie_score', '_temp_oie_score'`, 
    `'oie_score', '_temp_oie_score', 'revenue', 'annual_revenue', 'estimated_revenue', 'employees', 'employee_count', 'company_size', 'founded', 'year_founded', 'founded_year', 'certifications', 'iso_certifications', 'brands', 'product_brands'`
  );
  
  // Now we need to render these new fields
  const renderTarget = `{/* Location Information */}`;
  const renderCorporate = `
            {/* Corporate Profile */}
            {(revenue || employees || founded || certifications || brands) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-primary" /> Corporate Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                    {founded && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Founded</span>
                        <span className="font-medium">{founded}</span>
                      </div>
                    )}
                    {employees && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Employees</span>
                        <span className="font-medium">{employees}</span>
                      </div>
                    )}
                    {revenue && (
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Annual Revenue</span>
                        <span className="font-medium">{revenue}</span>
                      </div>
                    )}
                    {certifications && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Certifications</span>
                        <span className="font-medium">{certifications}</span>
                      </div>
                    )}
                    {brands && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Associated Brands</span>
                        <span className="font-medium">{brands}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Information */}`;
            
  content = content.replace(renderTarget, renderCorporate);
  fs.writeFileSync(path, content);
  console.log("Successfully patched LeadDetailPage corporate fields");
} else {
  console.log("Failed to find target string in LeadDetailPage");
}
