// AI-powered lead classification utility
// Uses Gemini API when available, falls back to keyword matching

import { supabase } from '@/integrations/supabase/client';
import type { AIClassification, Industry, Subcategory } from '@/types/intelligence';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Classify a lead into industry/subcategory/tags using AI or keyword matching
 */
export async function classifyLead(
  title: string,
  description: string,
  location: string,
  existingIndustries: Industry[],
  existingSubcategories: Subcategory[]
): Promise<AIClassification> {
  // Try AI classification first
  if (GEMINI_API_KEY && GEMINI_API_KEY !== 'REPLACE_WITH_YOUR_GEMINI_API_KEY') {
    try {
      return await classifyWithAI(title, description, location, existingIndustries, existingSubcategories);
    } catch (err) {
      console.warn('AI classification failed, falling back to keyword matching:', err);
    }
  }

  // Fallback to keyword matching
  return classifyWithKeywords(title, description, existingIndustries, existingSubcategories);
}

async function classifyWithAI(
  title: string,
  description: string,
  location: string,
  industries: Industry[],
  subcategories: Subcategory[]
): Promise<AIClassification> {
  const industryList = industries.map(i => `${i.id}:${i.name}`).join(', ');
  const subcatList = subcategories.map(s => `${s.id}:${s.name}(industry:${s.industry_id})`).join(', ');

  const prompt = `Classify this business lead into the correct industry and subcategory.

Lead Title: "${title}"
Description: "${description}"
Location: "${location}"

Available Industries: ${industryList}
Available Subcategories: ${subcatList}

Return ONLY valid JSON (no markdown) with these fields:
- industry_id: UUID of best matching industry (or null)
- industry_name: name of matched industry (or null)
- subcategory_id: UUID of best matching subcategory (or null)
- subcategory_name: name of matched subcategory (or null)
- tags: array of 3-5 relevant keyword tags
- confidence: number 0-1 (how confident you are)
- reasoning: brief explanation`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as AIClassification;
}

function classifyWithKeywords(
  title: string,
  description: string,
  industries: Industry[],
  subcategories: Subcategory[]
): AIClassification {
  const text = `${title} ${description}`.toLowerCase();

  // Keyword maps for industries
  const industryKeywords: Record<string, string[]> = {
    construction: ['construction', 'peb', 'warehouse', 'civil', 'epc', 'contractor', 'building', 'infrastructure', 'steel structure'],
    marketing: ['marketing', 'seo', 'ads', 'advertising', 'social media', 'branding', 'digital', 'agency', 'content'],
    saas: ['saas', 'software', 'crm', 'platform', 'app', 'tool', 'cloud', 'subscription'],
    healthcare: ['healthcare', 'hospital', 'clinic', 'medical', 'pharma', 'health', 'diagnostic'],
    'real-estate': ['real estate', 'property', 'residential', 'commercial', 'developer', 'realty'],
    'solar-energy': ['solar', 'energy', 'renewable', 'panel', 'power', 'wind'],
    manufacturing: ['manufacturing', 'factory', 'production', 'plant', 'industrial', 'steel', 'metals'],
    'ai-ml': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'nlp', 'chatbot'],
    education: ['education', 'edtech', 'learning', 'school', 'university', 'training', 'course'],
    finance: ['finance', 'fintech', 'banking', 'payment', 'insurance', 'lending', 'investment'],
    logistics: ['logistics', 'supply chain', 'delivery', 'shipping', 'freight', 'warehouse', 'fleet'],
    ecommerce: ['ecommerce', 'e-commerce', 'online store', 'd2c', 'marketplace', 'retail'],
    recruitment: ['recruitment', 'hiring', 'staffing', 'hr', 'talent', 'jobs'],
    consulting: ['consulting', 'advisory', 'strategy', 'management consulting'],
    legal: ['legal', 'law', 'attorney', 'compliance', 'regulatory'],
  };

  let bestIndustry: Industry | null = null;
  let bestScore = 0;

  for (const industry of industries) {
    const keywords = industryKeywords[industry.slug] || [industry.name.toLowerCase()];
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += kw.split(' ').length; // multi-word matches score higher
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndustry = industry;
    }
  }

  // Find best subcategory within matched industry
  let bestSubcategory: Subcategory | null = null;
  if (bestIndustry) {
    const relevantSubs = subcategories.filter(s => s.industry_id === bestIndustry!.id);
    let bestSubScore = 0;
    for (const sub of relevantSubs) {
      const subWords = sub.name.toLowerCase().split(/\s+/);
      let subScore = 0;
      for (const w of subWords) {
        if (text.includes(w) && w.length > 2) subScore++;
      }
      if (subScore > bestSubScore) {
        bestSubScore = subScore;
        bestSubcategory = sub;
      }
    }
  }

  // Generate tags from text
  const allKeywords = Object.values(industryKeywords).flat();
  const matchedTags = allKeywords.filter(kw => text.includes(kw)).slice(0, 5);

  const confidence = bestScore > 3 ? 0.9 : bestScore > 1 ? 0.6 : bestScore > 0 ? 0.3 : 0;

  return {
    industry_id: bestIndustry?.id || null,
    industry_name: bestIndustry?.name || null,
    subcategory_id: bestSubcategory?.id || null,
    subcategory_name: bestSubcategory?.name || null,
    tags: matchedTags.length > 0 ? matchedTags : ['unclassified'],
    confidence,
    reasoning: bestIndustry
      ? `Matched to ${bestIndustry.name} based on keyword analysis (score: ${bestScore})`
      : 'No strong industry match found',
  };
}

export async function parseSearchQuery(
  query: string,
  industries: Industry[]
): Promise<{
  industry: string | null;
  geography: string | null;
  companyType: string | null;
  companySize: string | null;
  keywords: string[];
}> {
  const q = query.toLowerCase();

  // Geography detection (returns exact match keyword for database query accuracy)
  const geoKeywords: Record<string, string> = {
    dubai: 'Dubai',
    noida: 'Noida',
    uae: 'UAE',
    bangalore: 'Bangalore',
    delhi: 'Delhi',
    mumbai: 'Mumbai',
    pune: 'Pune',
    gurgaon: 'Gurgaon',
    india: 'India',
    usa: 'USA',
    singapore: 'Singapore',
    london: 'London',
    australia: 'Australia',
    europe: 'Europe'
  };

  let geography: string | null = null;
  for (const [kw, geo] of Object.entries(geoKeywords)) {
    if (q.includes(kw)) { geography = geo; break; }
  }

  // Industry detection
  let matchedIndustry: string | null = null;
  for (const ind of industries) {
    if (q.includes(ind.name.toLowerCase()) || q.includes(ind.slug.replace(/-/g, ' '))) {
      matchedIndustry = ind.id;
      break;
    }
  }

  // Company size detection
  let companySize: string | null = null;
  if (q.match(/\b(10|ten)\s*[-–to]+\s*(50|fifty)\b/)) companySize = '11-50';
  if (q.match(/\b(50|fifty)\s*[-–to]+\s*(200|two hundred)\b/)) companySize = '51-200';
  if (q.includes('startup') || q.includes('small')) companySize = '1-10';
  if (q.includes('enterprise') || q.includes('large')) companySize = '500+';

  // Company type
  let companyType: string | null = null;
  const typeKeywords: Record<string, string> = {
    startup: 'Startups', agency: 'Agencies', brand: 'D2C Brands',
    manufacturer: 'Manufacturers', hospital: 'Hospitals & Clinics',
    developer: 'Real Estate Firms', contractor: 'Construction Companies',
  };
  for (const [kw, type] of Object.entries(typeKeywords)) {
    if (q.includes(kw)) { companyType = type; break; }
  }

  // Extract remaining keywords
  const stopWords = new Set(['find', 'search', 'show', 'me', 'the', 'in', 'with', 'for', 'a', 'an', 'and', 'or', 'of', 'to', 'from']);
  const keywords = query.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));

  return { industry: matchedIndustry, geography, companyType, companySize, keywords };
}

