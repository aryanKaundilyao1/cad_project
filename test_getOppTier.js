const opp = {
  icp_tier: null,
  opportunity_scores: [],
  leads: {
    metadata: {
      oie_score: {
        icp_tier: "T3"
      }
    }
  }
};

const getOppTier = (opp) => opp.icp_tier || opp.opportunity_scores?.[0]?.score_breakdown?.icp_tier || opp.leads?.metadata?.oie_score?.icp_tier || opp.opportunity_scores?.[0]?.score_breakdown?.data_tier || 'UNSCORED';
const getOppScore = (opp) => opp.lead_score || opp.opportunity_scores?.[0]?.score_breakdown?.lead_score || opp.leads?.metadata?.oie_score?.lead_score || 0;

console.log("Tier:", getOppTier(opp));
console.log("Score:", getOppScore(opp));
