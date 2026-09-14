// Google Gemini AI Integration for Lead Generation
// Replace GEMINI_API_KEY with your actual key from https://aistudio.google.com/apikey

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface GeneratedLead {
  company_name: string;
  contact_person: string;
  designation: string;
  phone: string;
  email: string;
  location: string;
  requirement: string;
  estimated_budget: string;
  industry: string;
  urgency: 'high' | 'medium' | 'low';
}

/**
 * Generate B2B leads based on a user's business niche using Gemini AI
 */
export async function generateLeadsForNiche(
  niche: string,
  count: number = 8,
  region: string = 'India'
): Promise<GeneratedLead[]> {
  if (!GEMINI_API_KEY) {
    // Fallback: generate mock leads when no API key is set
    return generateFallbackLeads(niche, count);
  }

  const prompt = `You are a B2B lead intelligence engine for the Indian market. Generate exactly ${count} realistic, high-quality B2B leads for a company operating in the "${niche}" industry/niche in ${region}.

Each lead should represent a potential buyer/client who would need services from a "${niche}" provider.

Return ONLY a valid JSON array (no markdown, no backticks, no explanation). Each object must have exactly these fields:
- company_name: realistic Indian company name
- contact_person: realistic Indian name
- designation: their role (CEO, Procurement Head, Project Manager, etc.)
- phone: realistic Indian phone number starting with +91
- email: realistic business email
- location: specific Indian city/area
- requirement: specific, detailed requirement (2-3 sentences)
- estimated_budget: budget range in INR (e.g. "₹50L - ₹1.2Cr")
- industry: which industry the buyer belongs to
- urgency: "high", "medium", or "low"

Make leads diverse in company size, budget, and location. Requirements should be specific and actionable.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return generateFallbackLeads(niche, count);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return generateFallbackLeads(niche, count);
    }

    // Parse the JSON response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const leads: GeneratedLead[] = JSON.parse(cleaned);
    return leads.slice(0, count);
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return generateFallbackLeads(niche, count);
  }
}

/**
 * Fallback: generate realistic-looking sample leads without AI
 */
function generateFallbackLeads(niche: string, count: number): GeneratedLead[] {
  const companies = [
    'Apex Industrial Solutions', 'NovaTech Engineering', 'Bharat Infra Projects',
    'Delta Build Corp', 'Sai Enterprises', 'Prism Infrastructure',
    'Zenith Manufacturing', 'Kiran Steel Works', 'Metro Constructions',
    'Atlas Commodities', 'GreenField Developers', 'Pinnacle Systems',
  ];

  const names = [
    'Rajesh Sharma', 'Priya Mehta', 'Anil Kumar', 'Sneha Gupta',
    'Vikram Singh', 'Meera Patel', 'Sanjay Reddy', 'Kavita Joshi',
    'Rohit Agarwal', 'Anita Verma', 'Deepak Nair', 'Pooja Iyer',
  ];

  const designations = [
    'Managing Director', 'Procurement Head', 'VP Operations',
    'Project Manager', 'CEO', 'Chief Engineer',
    'Purchase Manager', 'Plant Head', 'Director', 'COO',
  ];

  const locations = [
    'Greater Noida, UP', 'Gurugram, Haryana', 'Pune, Maharashtra',
    'Chennai, Tamil Nadu', 'Ahmedabad, Gujarat', 'Hyderabad, Telangana',
    'Bengaluru, Karnataka', 'Jaipur, Rajasthan', 'Mumbai, Maharashtra',
    'Lucknow, UP', 'Indore, MP', 'Kochi, Kerala',
  ];

  const budgets = [
    '₹5L - ₹15L', '₹10L - ₹50L', '₹25L - ₹1Cr',
    '₹50L - ₹2Cr', '₹1Cr - ₹5Cr', '₹2Cr - ₹10Cr',
    '₹5Cr - ₹25Cr', '₹15L - ₹75L',
  ];

  const urgencies: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];

  const requirements = [
    `Looking for ${niche} solutions for upcoming greenfield project. Need end-to-end delivery with installation support.`,
    `Expanding our facility and need ${niche} expertise. Immediate requirement with Q2 deadline.`,
    `Seeking quotes from verified ${niche} providers for a large-scale industrial project in our new plant.`,
    `Have a government contract requiring ${niche} services. Vendor must have prior institutional experience.`,
    `Planning warehouse expansion and need reliable ${niche} partner for phased execution over 6 months.`,
    `Need ${niche} consultation and execution for our manufacturing unit upgrade. Budget approved.`,
    `Multi-site rollout requiring ${niche} support across 3 locations. Long-term partnership preferred.`,
    `Urgent requirement for ${niche} — RFQ closing in 2 weeks. Competitive pricing required with references.`,
    `Greenfield factory setup requiring ${niche} expertise. Looking for turnkey solution provider.`,
    `Campus development project needs ${niche} capabilities. Pre-qualified vendors only.`,
    `Commercial building project requiring ${niche} services. RERA compliant execution needed.`,
    `Industrial park development seeking ${niche} expertise for Phase 2 expansion.`,
  ];

  return Array.from({ length: count }, (_, i) => ({
    company_name: companies[i % companies.length],
    contact_person: names[i % names.length],
    designation: designations[i % designations.length],
    phone: `+91 ${90000 + Math.floor(Math.random() * 9999)} ${10000 + Math.floor(Math.random() * 89999)}`,
    email: `${names[i % names.length].split(' ')[0].toLowerCase()}@${companies[i % companies.length].split(' ')[0].toLowerCase()}.in`,
    location: locations[i % locations.length],
    requirement: requirements[i % requirements.length],
    estimated_budget: budgets[i % budgets.length],
    industry: niche,
    urgency: urgencies[i % urgencies.length],
  }));
}
