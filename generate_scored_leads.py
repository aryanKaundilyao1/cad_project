import json
import os
from datetime import datetime

with open('leads.json', 'r') as f:
    raw_leads = json.load(f)

scored_leads = []
for lead in raw_leads:
    # 1. Evidence Confidence
    conf = 0.3
    if lead['confidence'] == 'High': conf = 0.9
    if lead['confidence'] == 'Medium': conf = 0.6
    
    # 2. EV
    ev = lead['raw_score'] * 2500
    
    # 3. LCB
    k = 1.0
    lcb = ev * (1 - k * (1 - conf))
    
    # 4. Quality
    quality = lead['raw_score'] * 10
    
    # Status
    if lcb >= 15000: status = 'CONTACT NOW'
    elif lcb >= 10000: status = 'INVESTIGATE'
    elif lcb >= 5000: status = 'NURTURE'
    else: status = 'LOW PRIORITY'
    
    lead.update({
        'ev': ev,
        'conf_value': conf,
        'lcb': lcb,
        'quality': quality,
        'status': status,
        'id': str(lead['id']),
        'created_at': datetime.utcnow().isoformat() + 'Z'
    })
    scored_leads.append(lead)

scored_leads.sort(key=lambda x: x['lcb'], reverse=True)

for i, lead in enumerate(scored_leads):
    lead['rank'] = i + 1

os.makedirs('src/data', exist_ok=True)
with open('src/data/validation_leads.json', 'w') as f:
    json.dump(scored_leads, f, indent=2)

print("Generated scored leads.")
