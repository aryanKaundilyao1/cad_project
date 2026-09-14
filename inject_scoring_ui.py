import re

with open('src/pages/LeadDetailPage.tsx', 'r') as f:
    content = f.read()

scoring_ui = """
            {/* OPPORTUNITY INTELLIGENCE JOEP SCORING CARD */}
            {lead.lcb !== undefined && (
              <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-white to-slate-50">
                <CardHeader className="border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center text-primary">
                        <Zap className="w-5 h-5 mr-2" />
                        JAS Opportunity Intelligence
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Rank #{lead.rank} — {lead.status}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono bg-primary/5">
                      LCB = EV · (1 − κ(1 − Conf))
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Metric Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                      <p className="text-xs font-semibold text-emerald-800 uppercase mb-1">Final LCB</p>
                      <p className="text-2xl font-bold text-emerald-900">${(lead.lcb || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-center">
                      <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Expected Value</p>
                      <p className="text-2xl font-bold text-blue-900">${(lead.commercial_value || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-center">
                      <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-amber-900">{(lead.evidence_confidence || 0).toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <p className="text-xs font-semibold text-slate-800 uppercase mb-1">Opportunity Quality</p>
                      <p className="text-2xl font-bold text-slate-900">{lead.opportunity_quality || 0}/100</p>
                    </div>
                  </div>

                  {/* Why JAS Prioritized This Lead */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3 tracking-wider">Why JAS Prioritized This Lead</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Strong Signal Detection</p>
                          <p className="text-sm text-slate-600">{lead.signals}</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Business Rationale</p>
                          <p className="text-sm text-slate-600">{lead.description}</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* What We Don't Know */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3 tracking-wider">What We Don't Know</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <XCircle className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">Exact Procurement Timeline</p>
                          <p className="text-sm text-slate-600">Requires direct outreach to confirm current buying cycle.</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-5 h-5 text-primary" />
                      <p className="font-semibold text-primary">Recommended Action</p>
                    </div>
                    <p className="text-sm text-foreground/80 ml-7">
                      Import to CRM and {lead.status === 'CONTACT NOW' ? 'initiate outreach immediately targeting BD/Ops leadership.' : 'monitor for additional signals.'}
                    </p>
                  </div>

                </CardContent>
              </Card>
            )}
"""

# I need to find the right place to inject this.
# Look for a Card inside the main section, like the Company Overview card.
# Let's insert it before the CRM actions or after the Company Overview card.

target_string = """<div className="space-y-6">"""
split_content = content.split(target_string)

# Wait, there might be multiple <div className="space-y-6">
# Let's insert it after the main content div, or before the sidebar.
# The layout is usually:
# <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mt-6">
#   <div className="lg:col-span-2 space-y-6">
#     ... main cards ...
#   </div>
#   <div className="space-y-6">
#     ... sidebar cards ...
#   </div>
# </div>

if len(split_content) >= 3:
    # the second <div className="space-y-6"> is the sidebar
    content = split_content[0] + target_string + split_content[1] + scoring_ui + target_string + split_content[2]
else:
    # Try inserting right after the first <Card>...</Card> block inside the main area
    pass

with open('src/pages/LeadDetailPage.tsx', 'w') as f:
    f.write(content)

print("Injected Scoring UI")
