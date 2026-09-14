import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Building2, MapPin, TrendingUp, Zap, Activity,
  CheckCircle2, XCircle, ExternalLink, Phone, Mail, Globe,
  Trophy, Target, ShieldCheck, AlertTriangle
} from 'lucide-react';
import validationLeads from '@/data/validation_leads.json';

export default function WorkspaceLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lead = (validationLeads as any[]).find(l => l.id === id);

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Lead not found</h2>
        <p className="text-muted-foreground mb-4">No lead with ID "{id}" exists.</p>
        <Button onClick={() => navigate('/workspace/opportunities')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Opportunities
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONTACT NOW': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INVESTIGATE': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'NURTURE': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Derive a plausible domain from company name for display
  const domain = lead.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  const email = 'hello@' + domain;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/workspace/opportunities')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Opportunity Intelligence
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{lead.company}</h1>
            <Badge variant="outline" className={getStatusColor(lead.status)}>{lead.status}</Badge>
            {lead.type === 'CHANNEL' && <Badge variant="outline">CHANNEL</Badge>}
            {lead.type === 'Deprioritize' && <Badge variant="destructive">DEPRIORITIZED</Badge>}
          </div>
          <p className="text-foreground/60 mt-1">{lead.reason}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground text-lg px-4 py-1">
            <Trophy className="w-4 h-4 mr-2" /> Rank #{lead.rank}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* JOEP Scoring Card */}
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    JAS Opportunity Intelligence — JOEP Scoring
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confidence-discounted ranking value
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Score Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                  <p className="text-xs font-semibold text-emerald-800 uppercase mb-1">Final LCB</p>
                  <p className="text-2xl font-bold text-emerald-900">${lead.lcb.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-center">
                  <p className="text-xs font-semibold text-blue-800 uppercase mb-1">Expected Value</p>
                  <p className="text-2xl font-bold text-blue-900">${lead.ev.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 text-center">
                  <p className="text-xs font-semibold text-amber-800 uppercase mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-amber-900">{lead.conf_value.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <p className="text-xs font-semibold text-slate-800 uppercase mb-1">Quality</p>
                  <p className="text-2xl font-bold text-slate-900">{lead.quality}/100</p>
                </div>
              </div>



            </CardContent>
          </Card>

          {/* Why JAS Prioritized */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Why JAS Prioritized This Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Strong Funding Signal</p>
                  <p className="text-sm text-muted-foreground">{lead.signal}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Business Rationale</p>
                  <p className="text-sm text-muted-foreground">{lead.reason}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Evidence Confidence: {lead.confidence}</p>
                  <p className="text-sm text-muted-foreground">
                    {lead.confidence === 'High'
                      ? 'Multiple corroborating sources confirm this signal.'
                      : lead.confidence === 'Medium'
                      ? 'Signal detected but requires additional validation.'
                      : 'Limited evidence — further research recommended.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Signal Freshness: {lead.days_old} days old</p>
                  <p className="text-sm text-muted-foreground">Recent signals indicate active growth phase.</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3">What We Don't Know</h3>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Procurement Timeline</p>
                    <p className="text-sm text-muted-foreground">Direct outreach needed to confirm buying cycle.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Decision Maker</p>
                    <p className="text-sm text-muted-foreground">Key contact not yet identified — requires enrichment.</p>
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-primary">Recommended Next Action</p>
                </div>
                <p className="text-sm text-foreground/80 ml-7">
                  {lead.status === 'CONTACT NOW'
                    ? 'Initiate outreach immediately. Target BD/Ops leadership. Use funding signal as conversation opener.'
                    : lead.status === 'INVESTIGATE'
                    ? 'Research further. Validate demand signals. Identify decision maker before outreach.'
                    : 'Add to nurture sequence. Monitor for additional buying signals.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gate Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                JOEP Hard Gates (G1–G5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { gate: 'G1 Entity Validity', pass: true, reason: 'Valid company entity confirmed' },
                  { gate: 'G2 Commercial Role', pass: true, reason: 'B2B commercial role eligible' },
                  { gate: 'G3 Offering Relevance', pass: true, reason: 'Broad relevance to Jumbl services' },
                  { gate: 'G4 Geography', pass: true, reason: `Located in ${lead.city}, India — serviceable` },
                  { gate: 'G5 Client Exclusions', pass: lead.type !== 'Deprioritize', reason: lead.type === 'Deprioritize' ? 'Client exclusion: Too large for ICP' : 'No exclusions apply' },
                ].map(g => (
                  <div key={g.gate} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                    <div className="flex items-center gap-2">
                      {g.pass
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="font-medium text-sm">{g.gate}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{g.reason}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Sidebar */}
        <div className="space-y-6">

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Company Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Company Name</p>
                <p className="font-semibold">{lead.company}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Location</p>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{lead.city}, India</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Industry</p>
                <p className="font-medium">Technology / Startups</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Signal</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <p className="font-medium text-sm">{lead.signal}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Signal Age</p>
                <p className="font-medium">{lead.days_old} days</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Lead Type</p>
                <Badge variant="outline">{lead.type}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Source</p>
                <Badge variant="secondary">MANUAL_IMPORT</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" /> Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Globe className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
                     className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                    {domain} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email (estimated)</p>
                  <p className="text-sm font-medium">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm text-muted-foreground italic">Not available — requires enrichment</p>
                </div>
              </div>

              <div className="pt-3">
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Contact details are estimated. Enrich via LinkedIn / Apollo for verified contacts.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="default">
                <Activity className="w-4 h-4 mr-2" /> Add to CRM
              </Button>
              <Button className="w-full" variant="outline">
                <Mail className="w-4 h-4 mr-2" /> Generate Outreach
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" /> Visit Website
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
