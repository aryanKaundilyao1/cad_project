import fs from 'fs';

const path = 'supabase/functions/run-client-scoring/index.ts';
let content = fs.readFileSync(path, 'utf8');

const target = `  score = fitScore + repScore + trustScore;

  score = clamp(Math.round(score), 0, 100);

  // If score is zero but they have some structural data, floor it at 15
  if (score < 15 && (lead?.website || lead?.phone)) score = 15;`;

const replacement = `  // Data completeness factor for base score (0 to 10 points)
  let completenessScore = 0;
  if (lead?.website || (lead?.metadata && lead.metadata.website)) completenessScore += 3;
  if (lead?.phone || (lead?.metadata && lead.metadata.phone)) completenessScore += 3;
  if (lead?.address || (lead?.metadata && lead.metadata.address)) completenessScore += 2;
  if (lead?.description || (lead?.metadata && lead.metadata.description)) completenessScore += 2;

  // Claimed status factor (0 or 5 points)
  let claimedScore = 0;
  if (lead?.is_claimed || (lead?.metadata && lead.metadata.claimed)) {
    claimedScore = 5;
    reasons.push('+ Verified/Claimed Business');
  }
  
  // Tie-breaker micro-score to ensure uniqueness (derived deterministically from company name length or place_id)
  let tieBreaker = 0;
  const nameLen = (lead?.company_name || lead?.name || '').length;
  if (nameLen > 0) tieBreaker = (nameLen % 10) / 10; // 0.0 to 0.9

  score = fitScore + repScore + trustScore + completenessScore + claimedScore + tieBreaker;

  // We keep a decimal point for precise sorting
  score = clamp(score, 0, 100);

  // If score is extremely low but they have some structural data, floor it at 15
  if (score < 15 && (completenessScore > 0)) score = 15 + tieBreaker;
  
  // Round to 1 decimal place for uniqueness
  score = Math.round(score * 10) / 10;`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log("Patched run-client-scoring edge function successfully.");
} else {
  console.log("Failed to patch edge function.");
}
