# Contactability Data Trace Audit

Based on the audit of opportunity `033e8077-b10f-4400-a1c4-9488b4cddfbe`, here is the data trace for why Contactability drops to 0%.

### 1. Source values
- **Lead ID:** `88066db6-c225-4117-bf19-a033f668596d`
  - `lead.phone`: `096041 15715`
  - `lead.email`: `null`
- **Company ID:** `88066db6-c225-4117-bf19-a033f668596d`
  - `company.phone`: `096041 15715`
  - `company.email`: `null`

### 2. Destination values
- **Opportunity ID:** `033e8077-b10f-4400-a1c4-9488b4cddfbe`
- **Account ID:** `2b9cd230-8df8-4c52-9344-5b2687dd7092`
  - `account.phone`: `096041 15715`
  - `account.email`: `null`
- **Contact:**
  - `contact.phone`: `null` *(No contact record exists)*
  - `contact.email`: `null` *(No contact record exists)*

### 3. Missing mapping
During the Phase 1B/1C migration (`sync_lead_to_opportunity` triggers and `INSERT INTO public.opportunities`), `leads.phone` and `leads.email` are successfully mapped to `jas_companies` and `accounts`, but **they are never mapped to the `contacts` table**.

Because no `contact` is generated from the `leads` table's contact information, the opportunity has no associated contacts or stakeholders. The system calculates contactability based on the opportunity's stakeholders/contacts, resulting in a 0% Contactability score despite the phone number existing at the account level.

### 4. Exact repair SQL
```sql
-- 1. Create missing contacts for accounts derived from leads that have contact info
INSERT INTO public.contacts (
    workspace_id,
    account_id,
    full_name,
    first_name,
    email,
    phone,
    contact_type
)
SELECT 
    a.workspace_id,
    a.id,
    COALESCE(l.contact_name, 'Unknown Contact'),
    COALESCE(split_part(l.contact_name, ' ', 1), 'Unknown'),
    l.email,
    l.phone,
    'standard'
FROM public.opportunities o
JOIN public.leads l ON l.id = o.legacy_lead_id
JOIN public.accounts a ON a.id = o.account_id
WHERE (l.phone IS NOT NULL OR l.email IS NOT NULL)
  AND NOT EXISTS (
      SELECT 1 FROM public.contacts c WHERE c.account_id = a.id
  );

-- 2. Link these contacts as stakeholders to the opportunity to restore contactability
INSERT INTO public.stakeholders (
    workspace_id,
    opportunity_id,
    contact_id,
    role
)
SELECT 
    c.workspace_id,
    o.id,
    c.id,
    'decision_maker'
FROM public.opportunities o
JOIN public.contacts c ON c.account_id = o.account_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.stakeholders s WHERE s.opportunity_id = o.id AND s.contact_id = c.id
);
```
