import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Duplicate of qualityScoreEngine.ts logic for standalone script
function calculateDataQualityScore(row) {
  const isPresent = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  };

  let identityScore = 0;
  if (isPresent(row.company_name) || isPresent(row.title) || isPresent(row.name)) identityScore += 6;
  if (isPresent(row.category) || isPresent(row.category_name) || isPresent(row.niche) || isPresent(row.subtypes)) identityScore += 5;
  if (isPresent(row.type) || isPresent(row.business_type)) identityScore += 3;
  
  const desc = row.description || row.about || '';
  if (typeof desc === 'string') {
    if (desc.length > 100) identityScore += 6;
    else if (desc.length > 50) identityScore += 4;
    else if (desc.length > 10) identityScore += 2;
  }

  let contactScore = 0;
  if (isPresent(row.phone) || isPresent(row.external_phone) || isPresent(row.phone_number)) contactScore += 12;
  if (isPresent(row.website) || isPresent(row.domain) || isPresent(row.url)) contactScore += 10;
  if (isPresent(row.email)) contactScore += 8;

  let locationScore = 0;
  if (isPresent(row.address) || isPresent(row.full_address) || isPresent(row.location)) locationScore += 6;
  if (isPresent(row.city)) locationScore += 3;
  if (isPresent(row.state) || isPresent(row.region)) locationScore += 3;
  if (isPresent(row.country)) locationScore += 1;
  if (isPresent(row.latitude) || isPresent(row.longitude)) locationScore += 2;

  let trustScore = 0;
  const rating = parseFloat(row.rating || row.google_rating || row.score || '0');
  if (rating >= 4.5) trustScore += 7;
  else if (rating >= 4.0) trustScore += 5;
  else if (rating >= 3.0) trustScore += 3;
  else if (rating > 0) trustScore += 1;

  const reviews = parseInt(row.review_count || row.reviews || row.reviews_data || '0', 10);
  if (reviews >= 500) trustScore += 13;
  else if (reviews >= 100) trustScore += 10;
  else if (reviews >= 50) trustScore += 7;
  else if (reviews >= 10) trustScore += 4;
  else if (reviews > 0) trustScore += 1;

  if (isPresent(row.business_status) || isPresent(row.status)) trustScore += 5;

  let completenessScore = 0;
  if (isPresent(row.hours) || isPresent(row.working_hours)) completenessScore += 4;
  if (isPresent(row.social_profiles) || isPresent(row.linkedin_url)) completenessScore += 6;

  const total = identityScore + contactScore + locationScore + trustScore + completenessScore;
  return Math.min(100, Math.max(0, total));
}

const extractString = (val) => {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    try { return JSON.stringify(val); } catch (e) { return ''; }
  }
  return String(val || '');
};

async function backfill() {
  console.log("Fetching all leads...");
  
  let allLeads = [];
  let from = 0;
  let to = 999;
  
  while (true) {
    const { data, error } = await supabase.from('leads').select('*').range(from, to);
    if (error) {
      console.error("Error fetching leads:", error);
      break;
    }
    if (!data || data.length === 0) break;
    
    allLeads = [...allLeads, ...data];
    from += 1000;
    to += 1000;
  }

  console.log(`Found ${allLeads.length} leads. Starting backfill...`);

  let updatedCount = 0;

  for (let i = 0; i < allLeads.length; i++) {
    const lead = allLeads[i];
    let needsUpdate = false;
    let newEmail = lead.email;

    // 1. Recover Email
    if (!newEmail && lead.metadata) {
      const meta = lead.metadata;
      const combinedMetaStr = Object.values(meta).map(extractString).join(' ');
      const rawDescription = extractString(meta.description || meta.about || meta.company_description) || combinedMetaStr;
      
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
      const emailMatch = rawDescription.match(emailRegex);
      if (emailMatch && emailMatch.length > 0) {
        newEmail = emailMatch[0].toLowerCase();
        needsUpdate = true;
      }
    }

    // 2. Recalculate Quality Score
    const newQualityScore = calculateDataQualityScore({
      ...lead,
      ...lead.metadata,
      email: newEmail || lead.email
    });

    if (newQualityScore !== lead.quality_score) {
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error } = await supabase.from('leads').update({
        email: newEmail,
        quality_score: newQualityScore
      }).eq('id', lead.id);

      if (error) {
        console.error(`Failed to update lead ${lead.id}:`, error);
      } else {
        updatedCount++;
        if (updatedCount % 100 === 0) console.log(`Updated ${updatedCount} leads...`);
      }
    }
  }

  console.log(`Backfill complete. Successfully updated ${updatedCount} out of ${allLeads.length} leads.`);
}

backfill();
