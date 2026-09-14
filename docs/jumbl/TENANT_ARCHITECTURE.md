# Tenant & Client Architecture

The workspace utilizes a robust B2B multi-tenant architecture isolated by Row Level Security (RLS) policies within Supabase.

## 1. Entities
- **USER** (`auth.users`): The authenticated human accessing JAS.
- **CLIENT** (`jas_clients`): The business entity (e.g., Jumbl).
- **MEMBERSHIP** (`jas_client_members`): The join table defining a User's role within a Client.

## 2. Row Level Security (RLS)
Data is securely isolated at the database level. Every client-owned record (e.g., `raw_leads`, `joep_opportunities`, `joep_score_snapshots`) includes a `client_id` foreign key.

RLS Policy defined via `public.is_client_member()` function:
```sql
CREATE POLICY "Tenant Isolation Policy" ON target_table
FOR ALL USING (public.is_client_member(client_id));
```
This guarantees that a user from Client A can never fetch or manipulate records from Client B, regardless of frontend filters or API vulnerabilities.

## 3. Frontend Workspace Context
The `ClientWorkspaceContext` handles session logic by querying the user's memberships on login, resolving the `activeClient`, and setting the scoped data environment. If no active membership is found, the user is blocked from viewing data with the message: *"No workspace has been assigned to this account."*
