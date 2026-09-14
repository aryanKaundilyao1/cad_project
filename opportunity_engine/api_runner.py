import json
import csv
import argparse
import urllib.request
import urllib.parse
from .models import Company, CompanyEvidence
from .engine import score_company
from .ranking import rank_companies

def load_config(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_data(product_id: str):
    # Load .env variables manually to avoid external dependencies like python-dotenv
    base_dir = os.path.dirname(os.path.dirname(__file__)) # Go up to jas connect root
    env_path = os.path.join(base_dir, ".env")
    
    supabase_url = ""
    supabase_key = ""
    
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("VITE_SUPABASE_URL="):
                    supabase_url = line.strip().split("=", 1)[1].strip("'\"")
                elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    supabase_key = line.strip().split("=", 1)[1].strip("'\"")
                    
    if not supabase_url or not supabase_key:
        raise Exception("Missing Supabase credentials in .env")

    # Query all raw leads
    endpoint = f"{supabase_url}/rest/v1/leads?select=*"
    req = urllib.request.Request(endpoint, headers={
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    })
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        raise Exception(f"Failed to fetch from Supabase: {str(e)}")

    result = []
    
    for lead in data:
        if not lead or lead.get("status") == "Closed":
            continue
            
        cid = lead["id"]
        # In a real scenario, evidence will come from the DB (e.g. from data enrichment).
        # We simulate mapping DB fields to our expected evidence dictionary structure.
        raw_import = lead.get("raw_import") or {}
        
        evidence_dict = {
            "industry": raw_import.get("industry", "Unknown"),
            "region": raw_import.get("region", "Unknown"),
            "website": lead.get("website", ""),
            "rating": raw_import.get("rating", ""),
            "products_handled": raw_import.get("products", "")
        }
        
        comp = Company(
            id=cid,
            name=lead["company_name"] or "Unknown Company",
            evidence=CompanyEvidence(raw_data=evidence_dict)
        )
        result.append(comp)
        
    return result

def determine_recommended_action(score) -> str:
    # Based on tier and confidence, generate an action
    tier = score.tier
    conf = score.confidence
    reasons = score.explanation.reasons
    
    action = "Research further"
    
    if tier == "Tier 1" and conf == "High":
        if "Decision maker identified" in reasons or "Job postings indicate procurement role" in reasons:
            action = "Call decision maker directly today."
        else:
            action = "Send personalised introduction email today."
    elif tier == "Tier 1":
        action = "Connect on LinkedIn then email."
    elif tier == "Tier 2":
        action = "Add to weekly nurture sequence."
    elif tier == "Tier 3":
        action = "Wait for procurement cycle."
    
    if score.total_score < 40:
        action = "Low priority. Do not engage."
        
    return action

def main():
    parser = argparse.ArgumentParser(description="Run Opportunity Intelligence Engine API")
    parser.add_argument("--product_id", type=str, default="", help="Product ID to fetch leads for")
    args = parser.parse_args()
    
    import os
    base_dir = os.path.dirname(__file__)
    config_path = os.path.join(base_dir, "config", "ayurveda_profile.json")
    
    config = load_config(config_path)
    
    try:
        companies = load_data(args.product_id) if args.product_id else []
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        return
    
    scored = []
    for c in companies:
        scored.append(score_company(c, config))
        
    # Rank them
    ranked = rank_companies(scored, top_n=100)
    
    # Calculate Summary Stats
    total_analyzed = len(scored)
    high_priority = len([s for s in ranked if s.tier == "Tier 1"])
    medium_priority = len([s for s in ranked if s.tier == "Tier 2"])
    low_priority = len([s for s in ranked if s.tier == "Tier 3"])
    avg_score = int(sum(s.total_score for s in ranked) / len(ranked)) if ranked else 0
    
    summary = {
        "leads_analyzed": total_analyzed,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "average_score": avg_score
    }
    
    results = []
    # Create a fast lookup for companies to get their raw evidence
    company_map = {c.id: c for c in companies}
    
    for i, s in enumerate(ranked, 1):
        action = determine_recommended_action(s)
        
        # Prepare a simple evidence block for the UI to display
        company = company_map.get(s.company_id)
        raw_data = company.evidence.raw_data if company else {}
        
        evidence_dict = {
            "products": raw_data.get("products_handled", ""),
            "industry": raw_data.get("industry", ""),
            "region": raw_data.get("region", ""),
            "quality": raw_data.get("quality_tier", "")
        }
        
        category_scores_dict = {
            k: {"score": v.score, "max_score": v.max_score}
            for k, v in s.components.items()
        }
        
        results.append({
            "rank": i,
            "company_id": s.company_id,
            "company_name": s.company_name,
            "total_score": s.total_score,
            "tier": s.tier,
            "confidence": s.confidence,
            "reasons": s.explanation.reasons,
            "recommended_action": action,
            "category_scores": category_scores_dict,
            "contact_info": {
                "website": raw_data.get("website", ""),
                "rating": raw_data.get("rating", "")
            },
            "evidence": evidence_dict
        })
        
    output = {
        "summary": summary,
        "results": results
    }
    
    # Print JSON to stdout so Node.js can parse it
    print(json.dumps(output))

if __name__ == "__main__":
    main()
