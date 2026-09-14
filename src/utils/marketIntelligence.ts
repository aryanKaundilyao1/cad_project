export interface MarketInsights {
  estimatedCostMin: number;
  estimatedCostMax: number;
  costBreakdown: { label: string; percentage: number; color: string }[];
  complianceChecklist: string[];
  timelineMinMonths: number;
  timelineMaxMonths: number;
  demandLevel: "High" | "Medium" | "Low";
  vendorDensityText: string;
}

const REGION_DATA: Record<string, { baseRate: number, compliances: string[], demand: "High" | "Medium" | "Low", vendors: number }> = {
  "delhi ncr": { baseRate: 1500, compliances: ["DPCC Clearance", "Fire NOC (Delhi Fire Service)", "MCD Building Plan Approval"], demand: "High", vendors: 45 },
  "maharashtra": { baseRate: 1800, compliances: ["MPCB Clearance", "MIDC Setup Approval", "Fire NOC (Directorate of Maharashtra Fire Services)"], demand: "High", vendors: 62 },
  "gujarat": { baseRate: 1300, compliances: ["GPCB Clearance", "GIDC Land Approval", "Fire Safety Certificate"], demand: "Medium", vendors: 38 },
  "karnataka": { baseRate: 1600, compliances: ["KSPCB Clearance", "KIADB Approval", "Fire Emergency Services NOC"], demand: "High", vendors: 50 },
  "tamil nadu": { baseRate: 1400, compliances: ["TNPCB Consent to Establish", "SIPCOT Approval", "Fire & Rescue Services NOC"], demand: "Medium", vendors: 41 },
  "default": { baseRate: 1200, compliances: ["State Pollution Control Board NOC", "Local Municipal Approval", "Fire Safety NOC"], demand: "Medium", vendors: 20 },
};

const PROJECT_TYPE_DATA: Record<string, { multiplier: number, baseMonths: number, areaDivisor: number }> = {
  "peb warehouse": { multiplier: 1.0, baseMonths: 2, areaDivisor: 20000 },
  "rcc factory": { multiplier: 1.5, baseMonths: 4, areaDivisor: 15000 },
  "cold storage": { multiplier: 2.2, baseMonths: 3, areaDivisor: 10000 },
  "commercial": { multiplier: 1.8, baseMonths: 5, areaDivisor: 10000 },
  "default": { multiplier: 1.2, baseMonths: 3, areaDivisor: 15000 },
};

export const generateMarketInsights = (location: string, projectType: string, totalArea: number): MarketInsights => {
  const locLower = location.toLowerCase();
  let regionKey = "default";
  
  // Fuzzy match region
  if (locLower.includes("delhi") || locLower.includes("ncr") || locLower.includes("noida") || locLower.includes("gurgaon") || locLower.includes("ghaziabad")) regionKey = "delhi ncr";
  else if (locLower.includes("maharashtra") || locLower.includes("mumbai") || locLower.includes("pune") || locLower.includes("thane")) regionKey = "maharashtra";
  else if (locLower.includes("gujarat") || locLower.includes("ahmedabad") || locLower.includes("surat") || locLower.includes("vadodara")) regionKey = "gujarat";
  else if (locLower.includes("karnataka") || locLower.includes("bangalore") || locLower.includes("bengaluru") || locLower.includes("mysore")) regionKey = "karnataka";
  else if (locLower.includes("tamil nadu") || locLower.includes("chennai") || locLower.includes("coimbatore")) regionKey = "tamil nadu";

  const typeLower = projectType.toLowerCase();
  let typeKey = "default";
  if (typeLower.includes("peb") || typeLower.includes("warehouse")) typeKey = "peb warehouse";
  else if (typeLower.includes("rcc") || typeLower.includes("factory")) typeKey = "rcc factory";
  else if (typeLower.includes("cold")) typeKey = "cold storage";
  else if (typeLower.includes("commercial")) typeKey = "commercial";

  const region = REGION_DATA[regionKey];
  const type = PROJECT_TYPE_DATA[typeKey];

  const area = totalArea && totalArea > 0 ? totalArea : 10000; // default to 10k sq ft if missing

  // Calculate costs
  const baseCost = area * region.baseRate * type.multiplier;
  const estimatedCostMin = Math.round(baseCost * 0.9);
  const estimatedCostMax = Math.round(baseCost * 1.15);

  // Calculate timeline
  const additionalMonths = Math.floor(area / type.areaDivisor);
  const timelineMinMonths = type.baseMonths + additionalMonths;
  const timelineMaxMonths = timelineMinMonths + (typeKey === "peb warehouse" ? 1 : 2);

  // Breakdown varies slightly by project type
  const costBreakdown = typeKey === "peb warehouse" 
    ? [
        { label: "Steel & Material", percentage: 65, color: "bg-blue-500" },
        { label: "Labor", percentage: 15, color: "bg-emerald-500" },
        { label: "Logistics", percentage: 15, color: "bg-orange-500" },
        { label: "Misc/Permits", percentage: 5, color: "bg-purple-500" },
      ]
    : [
        { label: "Material", percentage: 50, color: "bg-blue-500" },
        { label: "Labor", percentage: 30, color: "bg-emerald-500" },
        { label: "Logistics", percentage: 10, color: "bg-orange-500" },
        { label: "Misc/Permits", percentage: 10, color: "bg-purple-500" },
      ];

  const compliances = [
    ...region.compliances,
    "Labor License (Contract Labour Act)",
    "Factory Inspectorate Approval"
  ];

  if (typeKey === "cold storage") compliances.push("FSSAI Storage License");

  return {
    estimatedCostMin,
    estimatedCostMax,
    costBreakdown,
    complianceChecklist: compliances,
    timelineMinMonths,
    timelineMaxMonths,
    demandLevel: region.demand,
    vendorDensityText: `${region.vendors} active verified vendors within 50km radius of ${location || "your area"}.`
  };
};
