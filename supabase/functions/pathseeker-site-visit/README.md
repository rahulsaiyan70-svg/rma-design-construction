# Pathseeker site visit Edge Function

The client portal uses `read_visit_27` to check the signed-in user's own Pathseeker booking and its visit record. The staff portal uses `publish_visit_27` to create or update only the booking identified by `RMA-SV-PSIS-27`. Existing staff report uploads use `save_uploaded_report`; they are written server-side and require the same staff authorization.

The function validates the user's Supabase access token and requires an active `profiles` row with role `admin` or `engineer` for writes. The report content and target booking identifier are fixed server-side. Publishing requires the pre-existing, uniquely identified Pathseeker booking to be linked to a client account; it never creates or changes a booking. An existing `site_visits` row is updated without changing its `staff_id`; otherwise the function inserts one under the unique `booking_id` constraint and handles a concurrent insert. The Supabase service-role key is read only from the Edge Function environment and must never be added to frontend code.

Deploy the migration and function through the approved Supabase release process. The migration keeps existing policies, adds owner/staff read scoping, removes direct table privileges for ordinary roles, and grants the Edge Function's service role the operations it needs. If the legacy `site_visit_reports` table exists, it is scoped and secured too; the migration does not create that table. It does not modify production data or policies until applied.

Before deploying, ensure each authorized engineer has a trusted `profiles.role` value of `engineer` and `active = true`; all other roles fail closed. No production SQL or function deployment is performed by this repository change.
