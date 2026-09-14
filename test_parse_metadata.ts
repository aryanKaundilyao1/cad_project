const opp = {
  leads: {
    metadata: '{"oie_score":{"icp_tier":"T3"}}'
  }
};
console.log(opp.leads?.metadata?.oie_score?.icp_tier); // This will output undefined
