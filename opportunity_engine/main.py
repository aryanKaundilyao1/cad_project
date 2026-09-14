import json
import csv
import os
from .models import Company, CompanyEvidence
from .engine import score_company
from .ranking import rank_companies
from .explain import explain

def load_config(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_data(maps_path: str, research_path: str):
    companies = {}
    
    with open(maps_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = row["company_id"]
            companies[cid] = {"id": cid, "name": row["name"], "evidence": row}
            
    with open(research_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = row["company_id"]
            if cid in companies:
                companies[cid]["evidence"].update(row)
                
    result = []
    for cid, data in companies.items():
        comp = Company(
            id=data["id"],
            name=data["name"],
            evidence=CompanyEvidence(raw_data=data["evidence"])
        )
        result.append(comp)
        
    return result

def main():
    base_dir = os.path.dirname(__file__)
    config_path = os.path.join(base_dir, "config", "ayurveda_profile.json")
    maps_path = os.path.join(base_dir, "data", "sample_google_maps.csv")
    research_path = os.path.join(base_dir, "data", "dummy_research.csv")
    
    if not os.path.exists(maps_path) or not os.path.exists(research_path):
        print("Data files not found. Please run generate_dummy_data.py first.")
        return
        
    config = load_config(config_path)
    companies = load_data(maps_path, research_path)
    
    scored = []
    for c in companies:
        scored.append(score_company(c, config))
        
    top_20 = rank_companies(scored, top_n=20)
    
    print("\n" + "="*48)
    print("TOP 20 COMPANIES")
    print("="*48)
    
    for i, s in enumerate(top_20, 1):
        print(f"\n{i}.")
        print(s.company_name)
        print(explain(s))
        
    # Export to CSV
    export_path = os.path.join(base_dir, "ranked_results.csv")
    with open(export_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Rank", "Company ID", "Company Name", "Total Score", "Tier", "Confidence", "Reasons"])
        for i, s in enumerate(scored, 1):
            reasons_str = "; ".join(s.explanation.reasons)
            writer.writerow([i, s.company_id, s.company_name, s.total_score, s.tier, s.confidence, reasons_str])
            
    print(f"\nSuccessfully exported all scores to {export_path}")

if __name__ == "__main__":
    main()
