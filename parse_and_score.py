import re
import json

raw_text = """
1 Fundly.ai $4M pre-Series A 1 Mumbai 10 High B2B pharma distribution — scaling BD ops
2 DigitalPaani Rs 22 Cr 1 Bengaluru 10 High AI water infra, expanding internationally
3 ARC (gaming tech) Rs 10.5 Cr pre-seed 1 Bengaluru 9 High Hardware+OS, 50K waitlist, no HR yet
4 Iztri Rs 10 Cr seed 1 Bengaluru 9 High On-demand fabric care, hub expansion
5 Safebox $1.1M seed 1 Bengaluru 9 High SEBI-registered fintech, compliance/ops need
6 Sorry Sugar $1M seed 1 Gurugram 9 High D2C beverages, 3 stores, Rs 60Cr ARR target
7 Cradlewise $12M Series A 6-7 Bengaluru 9 High AI smart crib, consumer hardware
8 Kepler Aerospace $8M seed 4 Bengaluru 9 High Spacetech, defence contracts
9 Aeron Systems Rs 45 Cr pre-Series B 4 Bengaluru 9 High Aerospace/defence nav, scaling production
10 Zenergize Technologies $4M pre-Series A 4-7 Bengaluru 9 High EV chargers + solar, R&D + service scaling
11 Minimac Systems Rs 30 Cr pre-Series A 4 Bengaluru 8 High Climate-tech lubricant recycling
12 Medulance Rs 24 Cr Series A2 4 Gurugram 8 High 15K ambulances, 500+ cities
13 Alteon $2.5M pre-seed 4 Bengaluru 8 Medium Wind-powered autonomous aircraft
14 YOGa Clean Air Rs 20 Cr 4-9 Gurugram 8 High 5K+ homes, 11 cities
15 DocPharma $2M pre-Series A 4-9 Gurugram 8 High Building 100 dark stores, 50 cities
16 Leanwatts $2M seed 4 Hyderabad 8 High EV chargers + power electronics
17 Creedom Rs 4.1 Cr seed 4 Bengaluru 8 Medium AI growth coach for creators
18 Makr Microsystems Rs 10.2 Cr seed 6 Bengaluru 8 High Semiconductor metrology, customer validation
19 Circolife $4.5M pre-Series A 1-5 Mumbai 9 High AC subscription, 5 cities, 10K subs
20 Navana.ai Rs 40 Cr Series A 1-5 Mumbai 9 High Voice AI consumer product
21 Oppex AI Rs 4.2 Cr pre-seed 8 Bengaluru 8 High Fraud/AML AI for insurance/banking
22 Ultrahuman $70M 5-9 Bengaluru 8 High Large round, likely has in-house HR — see note
23 Airbound $37M Series A 15 Bengaluru 7 High Largest Indian drone raise, scaling mfg
24 Runable $21M Series A 14 Bengaluru 7 High AI agentic platform, $2M ARR in 3 weeks
25 Nexedge Capital $20M maiden 15 New Delhi 7 High $3B AUM in 18 months
26 InspeCity Rs 100 Cr pre-Series A 15 Mumbai (Thane) 7 High In-orbit satellite servicing
27 InstaAstro $12M Series A 13-20 Bengaluru 7 High AI astrology/spiritualtech
28 TrucksUp $8.2M growth 13-20 Gurugram 6 Medium Freight logistics, fleet expansion
29 Utsav Rs 36 Cr Series A 15 Kolkata 6 Medium Temple network, 8x revenue growth
30 CarbonStrong Rs 12.5 Cr seed 15 Bengaluru 7 High Climate-tech carbon accounting
31 Bruno Milano Rs 7.5 Cr seed 20 Noida 6 Medium D2C affordable premium watches
32 Third Wave Coffee Rs 408 Cr 16 Bengaluru 6 High Large round, expanding QSR outlets
33 Asaya Rs 88 Cr Series A 16 Bengaluru 7 High Clinical skincare D2C, 1.2L+ orders
34 WATER $2.5M 16 Bengaluru 6 Medium Physical AI, adaptive surfaces/chairs
35 Be Clinical Rs 21 Cr seed 16 Bengaluru 6 Medium Clinical skincare D2C
36 Yantraksh Logistics Rs 12 Cr 16 Bengaluru 6 Medium Reusable packaging pool, expanding
37 Rezolv AI $12.5M Series A 22 Mumbai 6 High AI-native lending-tech
38 NeoGeoInfo Technologies $20M Series A 22 Gurugram 6 High Geospatial intelligence, R&D + intl
39 lissun :) Rs 48 Cr Series A 22 Bengaluru 7 High Child healthtech, Sunshine centres
40 AlgoFET Rs 15 Cr 25-30 Bengaluru 5 Medium Autonomous drone docking, 2K+ units
41 Acres of Ice Climate-tech signal 10-39 Leh 5 Medium Ladakh AIR sites, expanding to 16 countries
42 Antimattr YC Fall 2026, $500K ~30 Bengaluru 6 High YC-backed voice-first AI wearables
43 Auxobit Aerospace Deeptech defence signal ~30 Maharashtra 5 Medium Unmanned systems for defence
44 base14 B2B SaaS APM signal ~30 Bengaluru 5 Medium Unified observability platform
45 CNN Foods D2C beverages signal ~30 Delhi 5 Medium Traditional Indian beverages, 2.5L cans/2mo
46 CopperPilot AI for EDA/hardware signal ~30 Bengaluru 6 Medium AI copilot for hardware engineers
47 Coremantle Indic language AI signal ~30 Bengaluru 5 Medium Data intelligence for Indian language AI
48 CUNIN $450K pre-seed ~30 Gurugram 6 Medium Gen Z fragrance lifestyle brand
49 DRIVN $80M financing, $140M total ~30 Gurugram 6 High EV commercial vehicle financing
50 Echovane $1M seed ~30 Bengaluru 6 High AI consumer research agents (P&G, Kantar clients)
51 Hulp $2.6M ~30 Gurugram 6 Medium AI household concierge, 100 families
52 Invisel Rs 4 Cr seed ~30 Pune 5 Medium Nano-coating tech, 60K customers
53 T-Hub Blueprint Cohort Accelerator cohort (14 startups) 27 Hyderabad 5 High CHANNEL Approach T-Hub, not the 14 individually.
54 Smartworks Coworking Rs 235 Cr contracted revenue 16 NCR/BLR/Mumbai 4 Medium ACCOUNT Managed office platform, AI/GCC expansion
55 SNITCH 5 new stores, 131 total 16 Multi-city 4 Medium ACCOUNT Menswear D2C, omnichannel expansion
56 Agnikul Cosmos 2 new Chennai test/mfg units 1 Chennai 7 High ACCOUNT Reusable rocket stage developer — only Chennai lead, high value
57 Amazon India 20L sellers, 3L new 1 Bengaluru 3 Low Deprioritize Too large for 5-150 employee ICP
58 IDFC FIRST Bank + BITS Pilani IGNITE Accelerator launch (8 startups) 6 Pilani/Pan-India 5 Medium CHANNEL Approach the accelerator; 8 health/climate startups to be named
"""

leads = []
for line in raw_text.strip().split("\n"):
    line = line.strip()
    if not line:
        continue
    
    # We can split on High, Medium, Low
    parts = re.split(r'\s+(High|Medium|Low)\s+', line)
    if len(parts) == 3:
        left, conf, right = parts
        
        # Parse left: ID, Company, Signal, Days, City, Score
        m = re.match(r'^(\d+)\s+(.+?)\s+(Rs.*?|\$.*?|\d+ new.*?|Accelerator.*?|Deeptech.*?|B2B.*?|D2C.*?|AI for.*?|Indic.*?|Climate-tech.*?)\s+(~?\d+(?:-\d+)?)\s+([\w\/\-\(\)\s]+?)\s+(\d+)$', left)
        if m:
            id_val = int(m.group(1))
            company = m.group(2).strip()
            signal = m.group(3).strip()
            days = m.group(4).strip()
            city = m.group(5).strip()
            score = int(m.group(6))
        else:
            # Fallback naive parse by splitting from the right
            left_parts = left.rsplit(" ", 2)
            score = int(left_parts[-1])
            city = left_parts[-2]
            rest = left_parts[0]
            id_val = int(rest.split(" ")[0])
            company = rest.split(" ")[1]
            signal = " ".join(rest.split(" ")[2:])
            days = "unknown"
            
        # Parse right
        m2 = re.match(r'^(ACCOUNT|CHANNEL|Deprioritize)?\s*(.*)$', right)
        type_val = m2.group(1).strip() if m2.group(1) else 'ACCOUNT'
        reason = m2.group(2).strip()
        
        leads.append({
            "id": id_val,
            "company": company,
            "signal": signal,
            "days_old": days,
            "city": city,
            "raw_score": score,
            "confidence": conf,
            "type": type_val,
            "reason": reason
        })

with open("leads.json", "w") as f:
    json.dump(leads, f, indent=2)
print(f"Parsed {len(leads)} leads")
