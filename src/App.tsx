import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BusinessProfileProvider } from "@/contexts/BusinessProfileContext";
import { ThemeProvider } from "@/components/theme-provider";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tenders from "./pages/Tenders";
import TenderDetails from "./pages/TenderDetails";
import Portfolio from "./pages/Portfolio";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import PostProject from "./pages/PostProject";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import LeadDetailPage from "./pages/LeadDetailPage";
import Profile from "@/pages/profile";
import CompanyProfile from "./pages/CompanyProfile";
import Settings from "./pages/Settings";
import VendorPortfolio from "@/pages/VendorPortfolio";
import Admin from "@/pages/Admin";
import AdminDataAcquisition from "@/pages/AdminDataAcquisition";
import SignalExplorer from "@/pages/SignalExplorer";
import IntelligenceDashboard from "@/pages/IntelligenceDashboard";


import AdminIntelligenceCenter from "@/pages/AdminIntelligenceCenter";
import AccountIntelligenceWorkspace from "@/pages/admin/AccountIntelligenceWorkspace";

import DiscoveryWorkspace from "@/pages/opportunities/DiscoveryWorkspace";
import OpportunitiesPage from "@/pages/opportunities/OpportunitiesPage";
import OpportunityWorkspace from "@/pages/opportunities/OpportunityWorkspace";
import AccountListPage from "@/pages/accounts/AccountListPage";
import AccountDetail from "@/pages/accounts/AccountDetail";
import ContactListPage from "@/pages/contacts/ContactListPage";
import ContactDetail from "@/pages/contacts/ContactDetail";
import TasksPage from "@/pages/tasks/TasksPage";
import ActivityPage from "@/pages/activity/ActivityPage";
import Dashboard3 from "@/pages/dashboard/Dashboard3";
import WebsiteScraperPage from "@/pages/tools/WebsiteScraperPage";
import CompanyEnrichmentPage from "@/pages/tools/CompanyEnrichmentPage";
import CompanyResearchPage from "@/pages/tools/CompanyResearchPage";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import AdminLeadDetails from "@/pages/AdminLeadDetails";
import AdminModuleEvidence from "@/pages/AdminModuleEvidence";
import AdminSignalViewer from "@/pages/AdminSignalViewer";
import AdminSignalExplorer from "@/pages/AdminSignalExplorer";
import AdminCompanyIntelligence from "@/pages/AdminCompanyIntelligence";
import AdminSignalAnalytics from "@/pages/AdminSignalAnalytics";
import AdminProviderRegistry from "@/pages/AdminProviderRegistry";
import AdminProviderHealth from "@/pages/AdminProviderHealth";
import AdminVerticalWeightManager from './pages/AdminVerticalWeightManager';
import AdminScoreVersionManager from './pages/AdminScoreVersionManager';
import AdminRebuildCenter from './pages/AdminRebuildCenter';
import AdminAuditCenter from './pages/AdminAuditCenter';
import AdminOutcomeExplorer from './pages/AdminOutcomeExplorer';
import AdminSnapshotViewer from './pages/AdminSnapshotViewer';
import AdminTrainingDatasetViewer from './pages/AdminTrainingDatasetViewer';
import AdminOutcomeTimeline from './pages/AdminOutcomeTimeline';
import AdminOutcomeAnalyticsDashboard from './pages/AdminOutcomeAnalyticsDashboard';
import AdminProbabilityExplorer from './pages/AdminProbabilityExplorer';
import AdminAutomationCenter from './pages/AdminAutomationCenter';
import AutomationAnalytics from './pages/AutomationAnalytics';
import AdminProbabilityProfile from './pages/AdminProbabilityProfile';
import AdminProbabilityTimeline from './pages/AdminProbabilityTimeline';
import AdminProbabilityAnalyticsDashboard from './pages/AdminProbabilityAnalyticsDashboard';
import AdminVersionExplorer from './pages/AdminVersionExplorer';
import AdminProbabilitySnapshotViewer from './pages/AdminProbabilitySnapshotViewer';
import AdminEvidenceExplorer from './pages/AdminEvidenceExplorer';
import AdminSignalIntelligenceDashboard from './pages/AdminSignalIntelligenceDashboard';
import AdminSignalRankingDashboard from './pages/AdminSignalRankingDashboard';
import AdminWoeExplorer from './pages/AdminWoeExplorer';
import AdminInformationValueDashboard from './pages/AdminInformationValueDashboard';
import AdminBayesFactorDashboard from './pages/AdminBayesFactorDashboard';
import AdminEvidenceSnapshotViewer from './pages/AdminEvidenceSnapshotViewer';
import AdminCalibrationDashboard from './pages/AdminCalibrationDashboard';
import AdminModelExplorer from './pages/AdminModelExplorer';
import AdminReliabilityDashboard from './pages/AdminReliabilityDashboard';
import AdminCalibrationAuditCenter from './pages/AdminCalibrationAuditCenter';
import AdminRetrainingCenter from './pages/AdminRetrainingCenter';
import AdminPredictiveIntelligenceDashboard from './pages/AdminPredictiveIntelligenceDashboard';
import AdminPredictiveModelExplorer from './pages/AdminPredictiveModelExplorer';
import AdminEnsembleDashboard from './pages/AdminEnsembleDashboard';
import AdminFeatureImportanceExplorer from './pages/AdminFeatureImportanceExplorer';
import AdminConfidenceDashboard from './pages/AdminConfidenceDashboard';
import AdminDriftMonitoringCenter from './pages/AdminDriftMonitoringCenter';
import AdminPredictionRetrainingCenter from './pages/AdminPredictionRetrainingCenter';
import AdminDecisionDashboard from './pages/AdminDecisionDashboard';
import AdminPlaybookManager from './pages/AdminPlaybookManager';
import AdminActionManager from './pages/AdminActionManager';
import AdminRecommendationViewer from './pages/AdminRecommendationViewer';
import AdminDecisionAuditViewer from './pages/AdminDecisionAuditViewer';
import AdminActionRecommendationViewer from './pages/AdminActionRecommendationViewer';
import AdminUrgencyDashboard from './pages/AdminUrgencyDashboard';
import AdminReasonCodeManager from './pages/AdminReasonCodeManager';
import AdminDecisionTraceViewer from './pages/AdminDecisionTraceViewer';
import AdminContactRankingDashboard from './pages/AdminContactRankingDashboard';
import AdminStakeholderViewer from './pages/AdminStakeholderViewer';
import AdminContactExplainabilityViewer from './pages/AdminContactExplainabilityViewer';
import AdminProductRecommendationDashboard from './pages/AdminProductRecommendationDashboard';
import AdminPlaybookRecommendationDashboard from './pages/AdminPlaybookRecommendationDashboard';
import AdminPlaybookTemplateManager from './pages/AdminPlaybookTemplateManager';
import AdminRecommendationExplainabilityViewer from './pages/AdminRecommendationExplainabilityViewer';
import AdminDealHealthDashboard from './pages/AdminDealHealthDashboard';
import AdminRiskDashboard from './pages/AdminRiskDashboard';
import AdminStallDetectionDashboard from './pages/AdminStallDetectionDashboard';
import AdminFollowUpDashboard from './pages/AdminFollowUpDashboard';
import AdminInterventionDashboard from './pages/AdminInterventionDashboard';
import AdminDealExplainabilityDashboard from './pages/AdminDealExplainabilityDashboard';
import AdminExecutiveDashboard from './pages/AdminExecutiveDashboard';
import AdminRecommendationAnalyticsDashboard from './pages/AdminRecommendationAnalyticsDashboard';
import AdminAdoptionDashboard from './pages/AdminAdoptionDashboard';
import AdminPlaybookDashboard from './pages/AdminPlaybookDashboard';
import AdminActionCenter from './pages/AdminActionCenter';
import AdminExplainabilityCenter from './pages/AdminExplainabilityCenter';
import AdminOutcomeTrackingDashboard from './pages/AdminOutcomeTrackingDashboard';
import AdminEnginePerformanceDashboard from './pages/AdminEnginePerformanceDashboard';
import AdminRawEventExplorer from "@/pages/AdminRawEventExplorer";
import AdminEntityDashboard from "@/pages/AdminEntityDashboard";
import AdminReviewQueue from "@/pages/AdminReviewQueue";
import AdminAliasManager from "@/pages/AdminAliasManager";
import AdminProductRegistry from "@/pages/AdminProductRegistry";
import AdminArchetypeRegistry from "@/pages/AdminArchetypeRegistry";
import AdminSignalMapping from "@/pages/AdminSignalMapping";
import AdminProductIntelligence from "@/pages/AdminProductIntelligence";
import AdminFitExplorer from "@/pages/AdminFitExplorer";
import AdminIntentExplorer from "@/pages/AdminIntentExplorer";
import AdminTimingExplorer from "@/pages/AdminTimingExplorer";
import AdminEngagementExplorer from "@/pages/AdminEngagementExplorer";
import AdminOpportunityExplorer from "@/pages/AdminOpportunityExplorer";
import BookDemo from "@/pages/BookDemo";
import About from "./pages/About";
import CRM from "./pages/CRM";
import Projects from "./pages/projects/Projects";
import ProjectRoom from "./pages/projects/ProjectRoom";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Messages from "./pages/Messages";
import Onboarding from "./pages/Onboarding";
import SavedLeads from "./pages/SavedLeads";
import OpportunityFeed from "./pages/OpportunityFeed";
import ActionCenter from "./pages/ActionCenter";
import AdminRecommendationRules from "./pages/AdminRecommendationRules";
import OpportunityIntelligence from "./pages/OpportunityIntelligence";
import GrowthServices from "./pages/GrowthServices";
import FAQ from "./pages/FAQ";
import RefundPolicy from "./pages/RefundPolicy";
import AdminUniversalImport from "./pages/admin/AdminUniversalImport";

// Research OS
import Company360 from "./pages/research/Company360";
import ImportEngine from "./pages/research/ImportEngine";

// Marketplace

import AdminLeadImport from './pages/admin/AdminLeadImport';
import AdminClientManagement from "./pages/admin/AdminClientManagement";

// Premium Workspace
import { ClientWorkspaceProvider } from "@/contexts/ClientWorkspaceContext";
import { ClientWorkspaceLayout } from "@/components/layout/ClientWorkspaceLayout";
import { BuyerDashboardLayout } from "./components/layout/BuyerDashboardLayout";
import { ProductManager } from "./components/products/ProductManager";
import { ProductEditor } from "./components/products/ProductEditor";
import { ProductBulkImport } from "./components/products/ProductBulkImport";

import BuyerOrders from "./pages/buyer/BuyerOrders";
import BuyerWishlist from "./pages/buyer/BuyerWishlist";
import { PermissionMiddleware } from "@/components/layout/PermissionMiddleware";
import WorkspaceOverview from "./pages/workspace/WorkspaceOverview";
import WorkspaceProductDashboard from "./pages/workspace/WorkspaceProductDashboard";
import WorkspaceCampaigns from "./pages/workspace/WorkspaceCampaigns";
import WorkspaceLeadIntelligence from "./pages/workspace/WorkspaceLeadIntelligence";
import WorkspaceLeadDetail from "./pages/workspace/WorkspaceLeadDetail";
import WorkspaceEnquiries from "./pages/workspace/WorkspaceEnquiries";
import WorkspaceMyLeads from "./pages/workspace/WorkspaceMyLeads";
import WorkspaceCRM from "./pages/workspace/WorkspaceCRM";
import WorkspaceGTM from "./pages/workspace/WorkspaceGTM";
import WorkspaceMeetings from "./pages/workspace/WorkspaceMeetings";
import WorkspaceFollowUps from "./pages/workspace/WorkspaceFollowUps";
import WorkspaceCompanyProfile from "./pages/workspace/WorkspaceCompanyProfile";
import WorkspaceProductManagement from "./pages/workspace/WorkspaceProductManagement";
import WorkspaceDocuments from "./pages/workspace/WorkspaceDocuments";
import WorkspaceProfilePreview from "./pages/workspace/WorkspaceProfilePreview";
import WorkspaceScoringEngine from "./pages/workspace/WorkspaceScoringEngine";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="jasconnect-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <AuthProvider>
      <BusinessProfileProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/tenders" element={<Tenders />} />
              <Route path="/tenders/:id" element={<TenderDetails />} />

              <Route path="/opportunity-feed" element={<OpportunityFeed />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/legacy-dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectRoom />} />
              <Route path="/post-project" element={<PostProject />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Marketplace Public Routes */}
              
                
                
                
                
                
                
                
                
                
                <Route path="settings" element={<div className="p-6 h-[80vh] flex items-center justify-center text-muted-foreground">Settings coming soon...</div>} />
                <Route path="subscription" element={<div className="p-6 h-[80vh] flex items-center justify-center text-muted-foreground">Subscription coming soon...</div>} />
              
              {/* Buyer Portal */}
              
              
              <Route path="/company/:id" element={<CompanyProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/vendor-portfolio" element={<VendorPortfolio />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/data-acquisition" element={<AdminDataAcquisition />} />
              <Route path="/admin/intelligence" element={<AdminIntelligenceCenter />} />
              
              {/* Admin Marketplace Routes */}
              <Route path="/admin/clients" element={<AdminClientManagement />} />
              <Route path="/admin/lead-import/:companyId" element={<AdminLeadImport />} />
              
              <Route path="/admin/leads/:id" element={<AdminLeadDetails />} />
              <Route path="/admin/leads/modules/:id" element={<AdminModuleEvidence />} />
              <Route path="/admin/signals" element={<AdminSignalViewer />} />
              <Route path="/admin/intelligence/explorer" element={<AdminSignalExplorer />} />
              <Route path="/admin/intelligence/analytics" element={<AdminSignalAnalytics />} />
              <Route path="/admin/intelligence/company/:id" element={<AdminCompanyIntelligence />} />
              <Route path="/admin/account-intelligence/:leadId" element={<AccountIntelligenceWorkspace />} />
              <Route path="/admin/providers/registry" element={<AdminProviderRegistry />} />
              <Route path="/admin/providers/health" element={<AdminProviderHealth />} />
              <Route path="/admin/providers/raw-events" element={<AdminRawEventExplorer />} />

              <Route path="/research/companies/:id" element={<Company360 />} />
              <Route path="/research/import" element={<ImportEngine />} />

              <Route path="/admin/recommendation-rules" element={<AdminRecommendationRules />} />
              <Route path="/admin/universal-import" element={<AdminUniversalImport />} />
              <Route path="/admin/entity" element={<AdminEntityDashboard />} />
              <Route path="/admin/entity/review" element={<AdminReviewQueue />} />
              <Route path="/admin/entity/aliases" element={<AdminAliasManager />} />
              <Route path="/admin/products" element={<AdminProductRegistry />} />
              <Route path="/admin/archetypes" element={<AdminArchetypeRegistry />} />
              <Route path="/admin/products/mapping/:productId" element={<AdminSignalMapping />} />
              <Route path="/admin/intelligence/product/:id" element={<AdminProductIntelligence />} />
              <Route path="/admin/scoring/rebuild" element={<AdminRebuildCenter />} />
              <Route path="/admin/scoring/audit" element={<AdminAuditCenter />} />
              
              {/* Phase 5A: Outcomes */}
              <Route path="/admin/outcomes/explorer" element={<AdminOutcomeExplorer />} />
              <Route path="/admin/automation" element={<AdminAutomationCenter />} />
              <Route path="/analytics/automation" element={<AutomationAnalytics />} />
              <Route path="/admin/outcomes/snapshots/:id" element={<AdminSnapshotViewer />} />
              <Route path="/admin/outcomes/dataset" element={<AdminTrainingDatasetViewer />} />
              <Route path="/admin/outcomes/timeline/:id" element={<AdminOutcomeTimeline />} />
              <Route path="/admin/outcomes/analytics" element={<AdminOutcomeAnalyticsDashboard />} />

              {/* Phase 5B: Probability Engine */}
            <Route path="/admin/probabilities/explorer" element={<AdminProbabilityExplorer />} />
            <Route path="/admin/probabilities/company/:id" element={<AdminProbabilityProfile />} />
            <Route path="/admin/probabilities/timeline/:companyId" element={<AdminProbabilityTimeline />} />
            <Route path="/admin/probabilities/analytics" element={<AdminProbabilityAnalyticsDashboard />} />
            <Route path="/admin/probabilities/versions" element={<AdminVersionExplorer />} />
            <Route path="/admin/probabilities/snapshots/:id" element={<AdminProbabilitySnapshotViewer />} />

            {/* Phase 5C: Evidence Extraction */}
            <Route path="/admin/evidence/explorer" element={<AdminEvidenceExplorer />} />
            <Route path="/admin/evidence/intelligence" element={<AdminSignalIntelligenceDashboard />} />
            <Route path="/admin/evidence/ranking" element={<AdminSignalRankingDashboard />} />
            <Route path="/admin/evidence/woe" element={<AdminWoeExplorer />} />
            <Route path="/admin/evidence/iv" element={<AdminInformationValueDashboard />} />
            <Route path="/admin/evidence/bayes" element={<AdminBayesFactorDashboard />} />
            <Route path="/admin/evidence/snapshots" element={<AdminEvidenceSnapshotViewer />} />
            
            {/* Phase 5D: Calibration Engine */}
            <Route path="/admin/calibration/dashboard" element={<AdminCalibrationDashboard />} />
            <Route path="/admin/calibration/models" element={<AdminModelExplorer />} />
            <Route path="/admin/calibration/reliability" element={<AdminReliabilityDashboard />} />
            <Route path="/admin/calibration/audit" element={<AdminCalibrationAuditCenter />} />
            <Route path="/admin/calibration/retrain" element={<AdminRetrainingCenter />} />

            {/* Phase 5E: Predictive Intelligence */}
            <Route path="/admin/predictive/dashboard" element={<AdminPredictiveIntelligenceDashboard />} />
            <Route path="/admin/predictive/models" element={<AdminPredictiveModelExplorer />} />
            <Route path="/admin/predictive/ensemble" element={<AdminEnsembleDashboard />} />
            <Route path="/admin/predictive/features" element={<AdminFeatureImportanceExplorer />} />
            <Route path="/admin/predictive/confidence" element={<AdminConfidenceDashboard />} />
            <Route path="/admin/predictive/drift" element={<AdminDriftMonitoringCenter />} />
            <Route path="/admin/predictive/retrain" element={<AdminPredictionRetrainingCenter />} />

            {/* Phase 6A & 6B: Decision Intelligence */}
            <Route path="/admin/decision/dashboard" element={<AdminDecisionDashboard />} />
            <Route path="/admin/decision/playbooks" element={<AdminPlaybookManager />} />
            <Route path="/admin/decision/actions" element={<AdminActionManager />} />
            <Route path="/admin/decision/recommendations" element={<AdminRecommendationViewer />} />
            <Route path="/admin/decision/action-recs" element={<AdminActionRecommendationViewer />} />
            <Route path="/admin/decision/urgency" element={<AdminUrgencyDashboard />} />
            <Route path="/admin/decision/reason-codes" element={<AdminReasonCodeManager />} />
            <Route path="/admin/decision/traces" element={<AdminDecisionTraceViewer />} />
            <Route path="/admin/decision/contact-ranks" element={<AdminContactRankingDashboard />} />
            <Route path="/admin/decision/stakeholders" element={<AdminStakeholderViewer />} />
            <Route path="/admin/decision/contact-traces" element={<AdminContactExplainabilityViewer />} />
            <Route path="/admin/decision/product-recs" element={<AdminProductRecommendationDashboard />} />
            <Route path="/admin/decision/playbook-recs" element={<AdminPlaybookRecommendationDashboard />} />
            <Route path="/admin/decision/playbook-templates" element={<AdminPlaybookTemplateManager />} />
            <Route path="/admin/decision/strategy-traces" element={<AdminRecommendationExplainabilityViewer />} />
            <Route path="/admin/decision/deal-health" element={<AdminDealHealthDashboard />} />
            <Route path="/admin/decision/deal-risks" element={<AdminRiskDashboard />} />
            <Route path="/admin/decision/deal-stalls" element={<AdminStallDetectionDashboard />} />
            <Route path="/admin/decision/follow-ups" element={<AdminFollowUpDashboard />} />
            <Route path="/admin/decision/interventions" element={<AdminInterventionDashboard />} />
            <Route path="/admin/decision/health-traces" element={<AdminDealExplainabilityDashboard />} />
            <Route path="/admin/decision/audit" element={<AdminDecisionAuditViewer />} />
            
            <Route path="/admin/decision/executive" element={<AdminExecutiveDashboard />} />
            <Route path="/admin/decision/recommendation-analytics" element={<AdminRecommendationAnalyticsDashboard />} />
            <Route path="/admin/decision/adoption" element={<AdminAdoptionDashboard />} />
            <Route path="/admin/decision/playbook-performance" element={<AdminPlaybookDashboard />} />
            <Route path="/admin/decision/action-center" element={<AdminActionCenter />} />
            <Route path="/admin/decision/explainability-center" element={<AdminExplainabilityCenter />} />
            <Route path="/admin/decision/outcomes" element={<AdminOutcomeTrackingDashboard />} />
            <Route path="/admin/decision/engine-performance" element={<AdminEnginePerformanceDashboard />} />
            <Route path="/admin/decision/recommendation-rules" element={<AdminRecommendationRules />} />

            <Route path="/admin/scoring/fit" element={<AdminFitExplorer />} />
              <Route path="/admin/scoring/intent" element={<AdminIntentExplorer />} />
              <Route path="/admin/scoring/timing" element={<AdminTimingExplorer />} />
              <Route path="/admin/scoring/engagement" element={<AdminEngagementExplorer />} />
              <Route path="/admin/scoring/opportunity" element={<AdminOpportunityExplorer />} />
              <Route path="/book-demo" element={<BookDemo />} />
              <Route path="/about" element={<About />} />
              <Route path="/lead/:id" element={<LeadDetailPage />} />
              <Route path="/legacy-crm" element={<CRM />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/opportunity-intelligence" element={<Navigate to="/#opportunity-intelligence" replace />} />
              <Route path="/growth-services" element={<Navigate to="/#growth-services" replace />} />
              <Route path="/industries" element={<Navigate to="/#industries" replace />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              
              {/* Client Portal (Legacy /app structure wrapped for premium clients) */}
              <Route path="/app" element={<PermissionMiddleware allowedRoles={['client_premium']}><SidebarLayout /></PermissionMiddleware>}>
                <Route path="dashboard" element={<Dashboard3 />} />
                <Route path="crm" element={<Navigate to="/app/dashboard" replace />} />
                <Route path="opportunities" element={<OpportunitiesPage />} />
                <Route path="signals" element={<SignalExplorer />} />
                <Route path="intelligence/dashboard" element={<IntelligenceDashboard />} />
                <Route path="action-center" element={<ActionCenter />} />
              
                <Route path="discovery" element={<DiscoveryWorkspace />} />
                <Route path="opportunities/:id" element={<OpportunityWorkspace />} />
                <Route path="discovery/:id" element={<OpportunityWorkspace />} />
                <Route path="accounts" element={<AccountListPage />} />
                <Route path="accounts/:id" element={<AccountDetail />} />
                <Route path="contacts" element={<ContactListPage />} />
                <Route path="contacts/:id" element={<ContactDetail />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="saved-leads" element={<SavedLeads />} />
                <Route path="tools/scraper" element={<WebsiteScraperPage />} />
                <Route path="lead/:id" element={<LeadDetailPage />} />
                <Route path="tools/enrichment" element={<CompanyEnrichmentPage />} />
                <Route path="tools/research" element={<CompanyResearchPage />} />
              </Route>

              {/* Premium Workspace Routes */}
              <Route path="/workspace" element={<PermissionMiddleware allowedRoles={['client_premium']}><ClientWorkspaceProvider><ClientWorkspaceLayout /></ClientWorkspaceProvider></PermissionMiddleware>}>
                <Route index element={<WorkspaceOverview />} />
                
                {/* Category Routes */}
                <Route path="category/:categoryId" element={<WorkspaceOverview />} />
                
                {/* Product Routes */}
                <Route path="product/:productId" element={<WorkspaceProductDashboard />} />
                <Route path="product/:productId/campaigns" element={<WorkspaceCampaigns />} />
                <Route path="product/:productId/leads" element={<WorkspaceMyLeads />} />
                <Route path="product/:productId/enquiries" element={<WorkspaceEnquiries />} />
                <Route path="product/:productId/analytics" element={<WorkspaceProductDashboard />} />
                <Route path="catalogue" element={<ProductManager isPremium={true} />} />
                <Route path="catalogue/new" element={<ProductEditor isPremium={true} />} />
                <Route path="catalogue/:id/edit" element={<ProductEditor isPremium={true} />} />
                <Route path="catalogue/import" element={<ProductBulkImport />} />
                
                
                
                
                
                
                {/* Legacy/Global Routes to remain for fallback/management */}
                 <Route path="lead/:id" element={<WorkspaceLeadDetail />} />
                 <Route path="intelligence" element={<WorkspaceLeadIntelligence />} />
                <Route path="crm" element={<WorkspaceCRM />} />
                <Route path="gtm" element={<WorkspaceGTM />} />
                <Route path="meetings" element={<WorkspaceMeetings />} />
                <Route path="follow-ups" element={<WorkspaceFollowUps />} />
                <Route path="company-profile" element={<WorkspaceCompanyProfile />} />
                <Route path="product-management" element={<WorkspaceProductManagement />} />
                <Route path="documents" element={<WorkspaceDocuments />} />
                <Route path="settings" element={<Settings />} />
                <Route path="scoring" element={<WorkspaceScoringEngine />} />
                
                {/* Unified Intelligence OS Routes */}
                <Route path="opportunities" element={<WorkspaceLeadIntelligence />} />
                <Route path="opportunities/:id" element={<OpportunityWorkspace />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="research" element={<CompanyResearchPage />} />
                <Route path="tenders" element={<SavedLeads />} />
                <Route path="crm" element={<WorkspaceCRM />} />
                <Route path="analytics" element={<WorkspaceProductDashboard />} />

                {/* Marketplace & Products Routes */}
                <Route path="catalogue" element={<ProductManager />} />
                
                
                
                
              </Route>
              <Route path="/workspace/profile-preview" element={<WorkspaceProfilePreview />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </BrowserRouter>
      </BusinessProfileProvider>
      </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
