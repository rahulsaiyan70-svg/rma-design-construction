-- Keep the existing RLS policies and add a restrictive owner/staff read boundary.
-- Mutations are performed only by the authenticated, role-checked Edge Function.

CREATE OR REPLACE FUNCTION public.can_read_site_visit_for_current_user(p_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND p.active IS TRUE
        AND lower(p.role) IN ('admin', 'engineer')
    )
    OR EXISTS (
      SELECT 1
      FROM public.bookings AS b
      WHERE b.id = p_booking_id
        AND b.client_user_id = (SELECT auth.uid())
    );
$function$;

REVOKE ALL ON FUNCTION public.can_read_site_visit_for_current_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_site_visit_for_current_user(uuid) TO authenticated;

CREATE POLICY site_visits_read_own_or_authorized_rma
  ON public.site_visits
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (public.can_read_site_visit_for_current_user(booking_id));

CREATE POLICY site_visits_read_scope_guard
  ON public.site_visits
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (public.can_read_site_visit_for_current_user(booking_id));

REVOKE ALL PRIVILEGES ON TABLE public.site_visits FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_visits TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.site_visits TO service_role;

-- Older deployments may also contain the legacy report table. Keep it secured
-- when present without creating it or requiring it in the production schema.
CREATE OR REPLACE FUNCTION public.can_read_site_visit_report_for_current_user(
  p_booking_id uuid,
  p_client_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
        AND p.active IS TRUE
        AND lower(p.role) IN ('admin', 'engineer')
    )
    OR p_client_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.bookings AS b
      WHERE b.id = p_booking_id
        AND b.client_user_id = (SELECT auth.uid())
    );
$function$;

REVOKE ALL ON FUNCTION public.can_read_site_visit_report_for_current_user(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_site_visit_report_for_current_user(uuid, uuid) TO authenticated;

DO $migration$
BEGIN
  IF to_regclass('public.site_visit_reports') IS NOT NULL THEN
    EXECUTE 'CREATE POLICY site_visit_reports_read_own_or_authorized_rma
      ON public.site_visit_reports AS PERMISSIVE FOR SELECT TO authenticated
      USING (public.can_read_site_visit_report_for_current_user(booking_id, client_user_id))';
    EXECUTE 'CREATE POLICY site_visit_reports_read_scope_guard
      ON public.site_visit_reports AS RESTRICTIVE FOR SELECT TO authenticated
      USING (public.can_read_site_visit_report_for_current_user(booking_id, client_user_id))';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.site_visit_reports FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.site_visit_reports TO authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE public.site_visit_reports TO service_role';
  END IF;
END
$migration$;
