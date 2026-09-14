import { scoreLead } from './src/scoring/pipeline';

const raw = {
    id: "lead-9999",
    company_name: "Test Corp",
    title: "Test Corp",
    industry: "Construction",
    source: "Manual",
    contact_name: "John",
    phone: "1234567890",
    email: "john@test.com",
    project_type: "PEB",
    estimated_company_revenue_band: "10M - 50M"
};

const result = scoreLead(raw as any);
console.log(JSON.stringify(result, null, 2));
