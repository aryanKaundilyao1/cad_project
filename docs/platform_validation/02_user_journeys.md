# JAS CONNECT User Journeys

This document traces the complete end-to-end journey of a Customer using JAS CONNECT. 

---

## Journey 1: Onboarding & Subscription

**1. Public Visitor (Landing Page)**
- User lands on `/` (Home).
- Reviews features, pricing (`/pricing`), and value proposition.
- Clicks "Start Free Trial" or "Sign Up".

**2. Authentication**
- User navigates to `/auth`.
- Enters email and password.
- *Expected Outcome*: Supabase Auth creates a new User record.

**3. Onboarding Configuration**
- User is redirected to `/onboarding`.
- Selects Target Industries (e.g., "Construction", "Logistics").
- Selects Target Geographies (e.g., "North America").
- Specifies Company Size targets.
- *Expected Outcome*: Preferences are saved to the `users` table or a related preferences table.

**4. Subscription (Stripe)**
- User is prompted to select a tier (Starter, Pro, Enterprise).
- Completes payment via Stripe checkout.
- *Expected Outcome*: `subscriptions` table is updated with active status.

---

## Journey 2: Daily Workflow & Lead Execution

**1. Dashboard Overview**
- User logs in and lands on `/dashboard`.
- Views high-level metrics: Total Leads, New Opportunities, Win Rates.

**2. Reviewing the Action Center**
- User navigates to the Action Center to see what the AI wants them to do *today*.
- They see a prioritized queue of actions (e.g., "Critical: Follow up with John at Acme Corp - Stall Risk").
- *Expected Outcome*: User executes the highest priority tasks first.

**3. Browsing the Opportunity Feed**
- User navigates to `/dashboard/opportunities`.
- This is the main feed of scored leads.
- The user filters the feed by `Opportunity Score > 80`.
- They click on a high-scoring company (e.g., "TechFlow").

**4. Opportunity Deep Dive**
- The user reviews the **Company Profile** (Firmographics).
- They check the **Intelligence Panel**:
  - `Fit Score` (Why this company is a good match).
  - `Intent Score` (What they are searching for).
  - `Timing Score` (Recent trigger events like "Funding Round").
  - `Purchase Probability` (e.g., "74% chance to close").
  
**5. Reviewing the AI Recommendation**
- In the Opportunity view, the AI Decision Engine provides a recommendation:
  - **Contact**: "Reach out to Sarah (CTO)."
  - **Product**: "Pitch the Enterprise Cloud Package."
  - **Playbook**: "Use the Security First playbook."
  - **Explainability**: The user clicks "Why?" to see the trace of exactly *why* the AI made this recommendation.

**6. Execution & CRM Sync**
- User accepts the recommendation.
- They click "Sync to Salesforce" or "Send Email".
- *Expected Outcome*: `decision_recommendation_adoption` logs this as an "Accepted" action. The lead is pushed to the CRM.

---

## Journey 3: Monitoring Outcomes

**1. Deal Progression (CRM Webhook)**
- Over the next few weeks, the user works the deal in their CRM (Salesforce).
- They move the deal to "Closed Won".
- *Expected Outcome*: CRM sends a webhook back to JAS CONNECT.

**2. Analytics Update**
- JAS CONNECT receives the "Won" status.
- `RecommendationOutcomeEngine` links the "Won" status and the `$50,000` revenue back to the original AI recommendation.
- The User's win rate analytics and the Admin's Executive Dashboard update to reflect the newly influenced revenue.
