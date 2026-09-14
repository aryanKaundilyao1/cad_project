function clamp(value: number, min: number, max: number) {
  if (isNaN(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

function getTargetCategories(productName: string, productCategory: string): string[] {
  const targets = new Set<string>();
  const combined = (productName + " " + productCategory).toLowerCase();
  
  if (combined.includes('ashwagandha') || combined.includes('ayurved') || combined.includes('herb') || combined.includes('extract')) {
    const keywords = [
      'health food store', 'vitamin', 'supplement', 'ayurvedic', 
      'herbalist', 'pharmacy', 'holistic', 'wellness center', 
      'fitness', 'gym', 'alternative medicine', 'naturopathic', 
      'organic shop', 'grocery store', 'supermarket', 'nutrition'
    ];
    keywords.forEach(k => targets.add(k));
  }
  
  targets.add('retail');
  targets.add('wholesaler');
  targets.add('distributor');
  
  if (productName) targets.add(productName.toLowerCase());
  if (productCategory) targets.add(productCategory.toLowerCase());
  
  return Array.from(targets);
}

function calculateBaseScore(lead: any, targetCategories: string[]) {
  let score = 0;
  let reasons: string[] = [];

  let fitScore = 0;
  const leadMainCat = lead?.main_category || (lead?.metadata ? lead.metadata.main_category : '') || '';
  const leadCatsList = lead?.categories ? (Array.isArray(lead.categories) ? lead.categories.join(' ') : lead.categories) : (lead?.metadata ? lead.metadata.categories : '') || '';
  const leadCats = (leadMainCat + ' ' + leadCatsList).toLowerCase();
  
  if (leadCats && targetCategories.length > 0) {
    let matched = false;
    for (const tag of targetCategories) {
      if (leadCats.includes(tag)) {
        fitScore += 35;
        if (!reasons.includes(`+ Store Category Match: ${tag}`)) reasons.push(`+ Store Category Match: ${tag}`);
        matched = true;
        break;
      }
    }
    if (!matched) {
       fitScore += 10;
    }
  } else if (leadCats) {
    fitScore += 10;
  }
  fitScore = clamp(fitScore, 0, 50);

  let repScore = 0;
  const reviewsCount = lead?.reviews ?? (lead?.metadata ? lead.metadata.reviews : 0) ?? 0;
  if (reviewsCount > 0) {
    repScore = clamp(Math.log10(Math.max(1, reviewsCount)) / 3, 0, 1.0) * 30;
    reasons.push(`+ Reputation (${reviewsCount} Reviews)`);
  }

  let trustScore = 0;
  const ratingVal = lead?.rating ?? (lead?.metadata ? lead.metadata.rating : undefined);
  if (ratingVal !== undefined && ratingVal >= 0 && ratingVal <= 5) {
    if (ratingVal >= 4.5) {
      trustScore = 20;
      reasons.push(`+ Excellent Rating (${ratingVal})`);
    } else if (ratingVal >= 4.0) {
      trustScore = 10;
      reasons.push(`+ High Rating (${ratingVal})`);
    } else if (ratingVal < 3.0 && reviewsCount > 10) {
      trustScore = -10;
      reasons.push(`- Poor Rating (${ratingVal})`);
    } else {
      trustScore = 5;
    }
  }

  // Data completeness factor for base score (0 to 10 points)
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
  score = Math.round(score * 10) / 10;

  return {
    score,
    reasons,
    confidence: 'Low',
    breakdown: { fitScore, repScore, trustScore, completenessScore, claimedScore, tieBreaker }
  };
}

function calculateScore(modules: any[], lead: any, productTags: string[]) {
  const targetCategories = getTargetCategories(productTags[0] || '', productTags[1] || '');

  if (!modules || modules.length === 0) {
    return calculateBaseScore(lead, targetCategories);
  }

  let score = 0;
  let reasons: string[] = [];
  let cont = 0, proc = 0, conf = 0, fit = 0, rep = 0, trust = 0;
  
  let hasContact = false;

  const uniqueModulesMap = new Map();
  for (const mod of modules) {
    if (mod.module_type) uniqueModulesMap.set(mod.module_type, mod);
  }
  const uniqueModules = Array.from(uniqueModulesMap.values());

  for (const mod of uniqueModules) {
    const ev = mod.evidence;
    if (!ev) continue;

    if (mod.module_type === 'LinkedIn Intelligence' || mod.module_type === 'Website Intelligence') {
      const textBlock = JSON.stringify(ev).toLowerCase();
      for (const tag of targetCategories) {
        if (textBlock.includes(tag)) {
          fit += 0.2;
          if (!reasons.includes(`+ Keyword Match: ${tag}`)) reasons.push(`+ Keyword Match: ${tag}`);
        }
      }
    }

    if (ev.decision_maker_email || ev.decision_maker_phone) {
      cont += 0.8;
      hasContact = true;
      if (!reasons.includes(`+ Decision Maker/Contact Verified`)) reasons.push(`+ Decision Maker/Contact Verified`);
    }

    if (ev.impexp_total_shipments && ev.impexp_total_shipments > 0) {
      const shipScore = clamp(Math.log10(Math.max(1, ev.impexp_total_shipments)) / 3, 0, 1.0);
      proc += shipScore;
      reasons.push(`+ Large Import Volume (${ev.impexp_total_shipments})`);
    }
    if (ev.marketplace_rfq_count && ev.marketplace_rfq_count > 0) {
      const rfqScore = clamp(Math.log10(Math.max(1, ev.marketplace_rfq_count)) / 2, 0, 1.0);
      proc += rfqScore;
      reasons.push(`+ High Intent: Active RFQs`);
    }
    
    if (ev.website_quality_score) {
      const wScore = clamp(ev.website_quality_score, 0, 100);
      trust += (wScore / 100) * 0.5;
    }
    if (ev.website_https) trust += 0.2;
    
    if (ev.linkedin_followers && ev.linkedin_followers > 0) {
      const flwScore = clamp(Math.log10(Math.max(1, ev.linkedin_followers)) / 4, 0, 1.0);
      rep += flwScore;
      reasons.push(`+ Strong Digital Presence (LinkedIn)`);
    }
  }
  
  const reviewsCount = lead?.reviews ?? (lead?.metadata ? lead.metadata.reviews : 0) ?? 0;
  if (reviewsCount > 0) {
    const revScore = clamp(Math.log10(Math.max(1, reviewsCount)) / 3, 0, 1.0) * 0.5;
    rep += revScore;
    if (reviewsCount > 100) reasons.push(`+ Strong Reputation (${reviewsCount} Reviews)`);
  }
  
  const ratingVal = lead?.rating ?? (lead?.metadata ? lead.metadata.rating : undefined);
  if (ratingVal !== undefined && ratingVal >= 0 && ratingVal <= 5) {
    if (ratingVal >= 4.0) trust += 0.2;
    if (ratingVal >= 4.5) trust += 0.3;
    if (ratingVal < 3.0 && reviewsCount > 10) {
       trust -= 0.5;
       reasons.push(`- Poor Rating`);
    }
  }
  
  if (lead?.is_spending_on_ads) proc += 0.5;
  if (lead?.phone) {
     cont += 0.2;
     hasContact = true;
  }
  
  const leadMainCat = lead?.main_category || (lead?.metadata ? lead.metadata.main_category : '') || '';
  const leadCatList2 = lead?.category || lead?.categories ? (Array.isArray(lead.categories) ? lead.categories.join(' ') : lead.categories) : (lead?.metadata ? lead.metadata.categories : '') || '';
  const catStr = (leadMainCat + ' ' + leadCatList2).toLowerCase();

  if (catStr) {
    for (const tag of targetCategories) {
      if (catStr.includes(tag)) {
        fit += 0.5;
        if (!reasons.includes(`+ Keyword Match: ${tag}`)) reasons.push(`+ Keyword Match: ${tag}`);
        break;
      }
    }
    fit += 0.2; 
  }

  fit = clamp(fit, 0, 1.0);
  cont = clamp(cont, 0, 1.0);
  proc = clamp(proc, 0, 1.0);
  rep = clamp(rep, 0, 1.0);
  trust = clamp(trust, 0, 1.0);
  
  conf = uniqueModules.length > 0 ? clamp(uniqueModules.length * 0.15, 0, 1.0) : 0; 

  let qualified = true;
  if (!hasContact) reasons.push(`- Missing Contact Information`);

  let baseScore = 0;
  let researchBoost = 0;
  if (qualified) {
     baseScore = ((rep * 0.35) + (trust * 0.35) + (fit * 0.30)) * 100;
     researchBoost = ((proc * 0.5) + (cont * 0.5)) * 100;
     const baseWeight = 0.6;
     const researchWeight = 0.4;
     const finalCalculated = Math.round((baseScore * baseWeight) + (researchBoost * researchWeight));
     
     score = clamp(finalCalculated, 0, 100);
     
     if (score < 25 && (lead?.website || lead?.phone)) {
        score = Math.max(score, 20);
     }
  } else {
     score = 0;
  }

  return {
    score,
    reasons,
    confidence: conf > 0.6 ? 'High' : (conf > 0.3 ? 'Medium' : 'Low'),
    breakdown: { baseScore, researchBoost, score }
  };
}

// SIMULATION

const randomChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => (Math.random() * (max - min) + min).toFixed(1);

const companySuffixes = ['Inc.', 'LLC', 'Group', 'Solutions', 'Global', 'Enterprises'];
const categories = ['health food store', 'vitamin', 'supplement', 'ayurvedic', 'retail', 'distributor', 'wholesaler', 'pharmacy', 'fitness'];

console.log("====================================================");
console.log(" PHASE 1: GENERATING 150 GOOGLE MAPS LEADS & BASE SCORING");
console.log("====================================================\n");

const leads = [];
const productTags = ['ashwagandha', 'health supplement'];

for (let i = 0; i < 150; i++) {
  const cName = `Test Company ${i} ${randomChoice(companySuffixes)}`;
  const category = randomChoice(categories);
  
  const hasWebsite = Math.random() > 0.3;
  const hasPhone = Math.random() > 0.1;
  const hasAddress = Math.random() > 0.2;
  
  const hasReviews = Math.random() > 0.2;
  const reviews = hasReviews ? randomInt(1, 1000) : 0;
  let rating = null;
  if (hasReviews) {
      // Skew ratings to be mostly good to simulate typical map listings
      const rand = Math.random();
      if (rand > 0.3) rating = parseFloat(randomFloat(4.0, 5.0));
      else if (rand > 0.1) rating = parseFloat(randomFloat(3.0, 3.9));
      else rating = parseFloat(randomFloat(1.0, 2.9));
  }

  const lead = {
    id: `lead_${i}`,
    company_name: cName,
    main_category: category,
    categories: [category],
    rating: rating,
    reviews: reviews,
    metadata: {
      claimed: Math.random() > 0.5,
      website: hasWebsite ? `https://www.site${i}.com` : null,
      phone: hasPhone ? `+180055500${i}` : null,
      address: hasAddress ? `123 St ${i}, NY` : null
    }
  };
  
  const scoreResult = calculateBaseScore(lead, getTargetCategories(productTags[0], productTags[1]));
  leads.push({ lead, scoreResult });
}

// Sort leads by base score descending
leads.sort((a, b) => b.scoreResult.score - a.scoreResult.score);

console.log("TOP 10 LEADS (BASE SCORE):");
console.log("Notice how identical base scores are broken by tie-breakers and data completeness, resulting in unique rankings.\n");

leads.slice(0, 10).forEach((l, idx) => {
  console.log(`Rank ${idx + 1}: ${l.lead.company_name} (Category: ${l.lead.main_category})`);
  console.log(`  Base Score: ${l.scoreResult.score}`);
  console.log(`  Google Maps Data: ${l.lead.rating ? l.lead.rating + ' stars' : 'No rating'}, ${l.lead.reviews} reviews. Claimed: ${l.lead.metadata.claimed}`);
  console.log(`  Completeness: Website=${!!l.lead.metadata.website}, Phone=${!!l.lead.metadata.phone}, Address=${!!l.lead.metadata.address}`);
  console.log(`  Score Breakdown: Fit: ${l.scoreResult.breakdown.fitScore}, Rep: ${l.scoreResult.breakdown.repScore.toFixed(1)}, Trust: ${l.scoreResult.breakdown.trustScore}, Completeness: ${l.scoreResult.breakdown.completenessScore}, Claimed: ${l.scoreResult.breakdown.claimedScore}, Tie-breaker: ${l.scoreResult.breakdown.tieBreaker}`);
  console.log(`  Reasons: ${l.scoreResult.reasons.join(', ')}`);
  console.log("--------------------------------------------------");
});

console.log("\n====================================================");
console.log(" PHASE 2: PROGRESSIVE OIE SCORING (ADDING MODULES)");
console.log("====================================================\n");

// Take 3 middle-tier leads and add modules to them to see how their score evolves
const testLeads = leads.slice(50, 53);

testLeads.forEach((l, idx) => {
  console.log(`\nEvaluating Lead: ${l.lead.company_name}`);
  console.log(`Initial Base Score: ${l.scoreResult.score}`);
  
  // 1. Add Website Intelligence
  console.log(`\n  -> Adding [Website Intelligence Module]`);
  const websiteModule = {
    module_type: 'Website Intelligence',
    evidence: {
      website_quality_score: 85,
      website_https: true,
      text_content: 'We sell ayurvedic supplements and vitamins.'
    }
  };
  let newScore = calculateScore([websiteModule], l.lead, productTags);
  console.log(`     New OIE Score: ${newScore.score}`);
  console.log(`     Reasons Added: ${newScore.reasons.join(', ')}`);
  
  // 2. Add LinkedIn Intelligence
  console.log(`\n  -> Adding [LinkedIn Intelligence Module]`);
  const linkedinModule = {
    module_type: 'LinkedIn Intelligence',
    evidence: {
      linkedin_followers: 2500,
      description: 'Global distributor of natural products'
    }
  };
  newScore = calculateScore([websiteModule, linkedinModule], l.lead, productTags);
  console.log(`     New OIE Score: ${newScore.score}`);
  
  // 3. Add Decision Maker Discovery
  console.log(`\n  -> Adding [Decision Maker Module]`);
  const dmModule = {
    module_type: 'Decision Maker',
    evidence: {
      decision_maker_email: 'ceo@company.com',
      decision_maker_phone: '+1 555 123 4567'
    }
  };
  newScore = calculateScore([websiteModule, linkedinModule, dmModule], l.lead, productTags);
  console.log(`     New OIE Score: ${newScore.score}`);
  console.log(`     Final Breakdown: Base Score Weight=${newScore.breakdown.baseScore.toFixed(1)} * 0.6, Research Boost=${newScore.breakdown.researchBoost.toFixed(1)} * 0.4`);
  console.log(`     Final Reasons: ${newScore.reasons.join(', ')}`);
  console.log("==================================================");
});
