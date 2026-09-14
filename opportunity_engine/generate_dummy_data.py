import csv
import random
import uuid

def generate_data():
    num_companies = 300
    regions = ["Germany", "France", "UK", "Saudi Arabia", "UAE", "Netherlands", "Qatar", "India", "USA", "Singapore"]
    industries = ["Retail", "Wholesale", "Distribution", "Healthcare", "Manufacturing", "E-commerce", "Construction"]
    product_options = ["Ashwagandha", "Turmeric", "Rice", "Carpets", "Blankets", "Quilts", "Textiles", "Spices", "Electronics"]
    certifications_options = ["WHO-GMP", "ISO 9001", "FDA Approved", "Organic Certified", "Fair Trade"]
    
    company_ids = [str(uuid.uuid4()) for _ in range(num_companies)]
    
    # 1. Generate sample_google_maps.csv
    maps_data = []
    for cid in company_ids:
        quality = random.choices(["Good", "Medium", "Poor"], weights=[0.2, 0.5, 0.3])[0]
        
        has_website = True if quality in ["Good", "Medium"] and random.random() > 0.2 else False
        website = f"https://www.{cid[:8]}.com" if has_website else ""
        
        rating = round(random.uniform(4.0, 5.0), 1) if quality == "Good" else (
                 round(random.uniform(2.5, 4.0), 1) if quality == "Medium" else
                 round(random.uniform(1.0, 2.5), 1))
        
        reviews = random.randint(50, 500) if quality == "Good" else (
                  random.randint(10, 50) if quality == "Medium" else
                  random.randint(0, 10))
                  
        maps_data.append({
            "company_id": cid,
            "name": f"Company_{cid[:8]}",
            "region": random.choice(regions),
            "website": website,
            "rating": rating,
            "reviews": reviews,
            "quality_tier": quality
        })
        
    with open("opportunity_engine/data/sample_google_maps.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["company_id", "name", "region", "website", "rating", "reviews", "quality_tier"])
        writer.writeheader()
        writer.writerows(maps_data)

    # 2. Generate dummy_research.csv
    research_data = []
    for c in maps_data:
        quality = c["quality_tier"]
        
        # Good companies have better indicators
        p_good = 0.8 if quality == "Good" else (0.4 if quality == "Medium" else 0.1)
        
        industry = random.choice(industries)
        products = random.sample(product_options, k=random.randint(1, 3))
        certs = random.sample(certifications_options, k=random.randint(0, 2)) if random.random() < p_good else []
        
        explicit_sourcing = random.choice(["RFP published", "Quote requested", ""]) if random.random() < p_good * 0.5 else ""
        topic_surge = random.randint(0, 5) if random.random() < p_good else 0
        pricing_visits = random.randint(0, 20) if random.random() < p_good else 0
        review_visits = random.randint(0, 10) if random.random() < p_good else 0
        job_postings = random.choice(["Procurement Manager", "Logistics Head", ""]) if random.random() < p_good else ""
        
        import_gaps = "Yes" if random.random() < p_good * 0.6 else "No"
        trigger_events = random.choice(["Funding round", "New facility", "M&A", ""]) if random.random() < p_good else ""
        
        # Penalties
        active_contract = "Yes" if random.random() < 0.1 else "No"
        hiring_freeze = "Yes" if random.random() < 0.05 else "No"
        financial_distress = "Yes" if random.random() < 0.05 else "No"
        
        days_since_last_signal = random.randint(1, 30) if random.random() < p_good else random.randint(30, 200)
        
        distinct_stakeholders = random.randint(1, 5) if random.random() < p_good else 1
        stakeholder_seniority = round(random.uniform(0.4, 1.0), 2)
        
        research_data.append({
            "company_id": c["company_id"],
            "industry": industry,
            "products_handled": "|".join(products),
            "certifications": "|".join(certs),
            "explicit_sourcing": explicit_sourcing,
            "topic_surge": topic_surge,
            "pricing_visits": pricing_visits,
            "review_visits": review_visits,
            "job_postings": job_postings,
            "import_gaps": import_gaps,
            "trigger_events": trigger_events,
            "active_contract": active_contract,
            "hiring_freeze": hiring_freeze,
            "financial_distress": financial_distress,
            "days_since_last_signal": days_since_last_signal,
            "distinct_stakeholders": distinct_stakeholders,
            "stakeholder_seniority": stakeholder_seniority
        })
        
    with open("opportunity_engine/data/dummy_research.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "company_id", "industry", "products_handled", "certifications", 
            "explicit_sourcing", "topic_surge", "pricing_visits", "review_visits", 
            "job_postings", "import_gaps", "trigger_events", "active_contract", 
            "hiring_freeze", "financial_distress", "days_since_last_signal", 
            "distinct_stakeholders", "stakeholder_seniority"
        ])
        writer.writeheader()
        writer.writerows(research_data)

    print("Successfully generated dummy data in opportunity_engine/data/")

if __name__ == "__main__":
    generate_data()
