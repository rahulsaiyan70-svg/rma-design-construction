import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const REQUEST_ID = "RMA-SV-PSIS-27";
const CLIENT_NAME = "Path Seeker International School";
const SITE_VISIT_SERVICE = "Path Seeker Site Visit Request";
const REPORT_TEXT = [
  "RMA DESIGN & CONSTRUCTION",
  "SITE VISIT REPORT — 17 NOVEMBER 2026",
  "Project: Pathseeker International School",
  "Date: Tuesday, 17 November 2026",
  "Status: Completed",
  "Site Visit Number: 27",
  "",
  "PERSONS PRESENT:",
  "- Shri Nimrandeep Singh Ji — Representative of the School.",
  "- Rahul Bhatti — Engineer, RMA Design and Construction.",
  "",
  "SITE OBSERVATIONS:",
  "During the visit, the construction work was jointly inspected by the school representative and the engineer.",
  "- Construction work up to a height of 8 feet had already been completed.",
  "- Column filling above the 8-foot level was in progress.",
  "- The progress and quality of the ongoing construction work were inspected.",
  "",
  "ENGINEER'S REMARKS:",
  "The construction work observed during the visit was found to be satisfactory. The work was progressing properly, and everything was satisfactory up to the date of inspection.",
].join("\n");

const allowedOrigins = new Set([
  "https://rmadesign.co.in",
  "https://www.rmadesign.co.in",
]);

function headersFor(req: Request): HeadersInit {
  const origin = req.headers.get("origin");
  return {
    ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

function respond(req: Request, body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: headersFor(req) });
}

function isExpectedBooking(booking: {
  client_name: string | null;
  service_type: string | null;
}): boolean {
  return booking.client_name?.trim().toLowerCase() === CLIENT_NAME.toLowerCase() &&
    booking.service_type?.trim().toLowerCase() === SITE_VISIT_SERVICE.toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return respond(req, { error: "Origin is not allowed." }, 403);
  }
  if (req.method === "OPTIONS") return new Response("ok", { headers: headersFor(req) });
  if (req.method !== "POST") return respond(req, { error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return respond(req, { error: "Server-side Supabase configuration is missing." }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  const tokenMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return respond(req, { error: "A valid user session is required." }, 401);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(tokenMatch[1]);
  if (authError || !authData.user) {
    return respond(req, { error: "The user session is invalid or expired." }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) return respond(req, { error: "A valid JSON request body is required." }, 400);
    payload = body;
  } catch {
    return respond(req, { error: "A valid JSON request body is required." }, 400);
  }
  const action = payload.action;
  if (action !== "read_visit_27" && action !== "publish_visit_27" && action !== "save_uploaded_report") {
    return respond(req, { error: "Unsupported site visit action." }, 400);
  }

  try {
    if (action === "read_visit_27") {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("id, client_name, service_type")
        .eq("request_id", REQUEST_ID)
        .eq("client_user_id", authData.user.id)
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!booking || !isExpectedBooking(booking)) return respond(req, { saved: false });

      const { data: visit, error: visitError } = await supabase
        .from("site_visits")
        .select("scheduled_date, status, visit_notes")
        .eq("booking_id", booking.id)
        .maybeSingle();

      if (visitError) throw visitError;
      if (!visit) return respond(req, { saved: false });

      const saved = visit.scheduled_date === "2026-11-17" &&
        visit.status?.toLowerCase() === "completed" &&
        visit.visit_notes === REPORT_TEXT;
      return respond(req, { saved, mismatch: !saved });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, active, full_name")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    const role = String(profile?.role || "").toLowerCase();
    if (profile?.active !== true || (role !== "admin" && role !== "engineer")) {
      return respond(req, { error: "Only an active RMA administrator or engineer may save inspection reports." }, 403);
    }

    if (action === "save_uploaded_report") {
      const bookingId = typeof payload.booking_id === "string" ? payload.booking_id.trim() : "";
      const fileUrl = typeof payload.file_url === "string" ? payload.file_url.trim() : "";
      const filePath = typeof payload.file_path === "string" ? payload.file_path.trim() : "";
      const title = typeof payload.title === "string" ? payload.title.trim() : "";
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId)) {
        return respond(req, { error: "A valid booking ID is required." }, 400);
      }
      if (!fileUrl || fileUrl.length > 2048 || !(fileUrl.startsWith("https://") || /^reports\/[a-zA-Z0-9._/-]+$/.test(fileUrl)) ||
        fileUrl.includes("..") || filePath.length > 1024 || title.length > 200) {
        return respond(req, { error: "The report title or file location is invalid." }, 400);
      }

      const { data: reportBooking, error: reportBookingError } = await supabase
        .from("bookings")
        .select("id, request_id, client_user_id, client_name, email, status, engineer_name, site_observations")
        .eq("id", bookingId)
        .maybeSingle();
      if (reportBookingError) throw reportBookingError;
      if (!reportBooking) return respond(req, { error: "Booking record not found." }, 404);

      const reportTitle = title || "Site Visit Inspection Report";
      const { error: reportError } = await supabase.from("site_visit_reports").insert({
        booking_id: reportBooking.id,
        request_id: reportBooking.request_id,
        client_user_id: reportBooking.client_user_id || null,
        title: reportTitle,
        engineer_name: reportBooking.engineer_name || profile.full_name || "RMA Engineer",
        observations: reportBooking.site_observations || "",
        file_path: filePath || null,
        file_url: fileUrl,
      });
      if (reportError) throw reportError;

      const { data: updatedBooking, error: bookingUpdateError } = await supabase
        .from("bookings")
        .update({ report_url: fileUrl, report_path: filePath || null })
        .eq("id", reportBooking.id)
        .select("id")
        .maybeSingle();
      if (bookingUpdateError) throw bookingUpdateError;
      if (!updatedBooking) throw new Error("Supabase did not confirm the booking report update.");

      const { error: historyError } = await supabase.from("status_history").insert({
        booking_id: reportBooking.id,
        request_id: reportBooking.request_id,
        previous_status: reportBooking.status,
        new_status: reportBooking.status,
        changed_by: profile.full_name || authData.user.email || "RMA staff",
        remarks: `Report document uploaded: ${reportTitle}`,
      });
      if (historyError) console.error("Site visit report status history could not be recorded:", historyError);

      return respond(req, {
        saved: true,
        booking: {
          id: reportBooking.id,
          request_id: reportBooking.request_id,
          client_user_id: reportBooking.client_user_id,
          client_name: reportBooking.client_name,
          email: reportBooking.email,
        },
      });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, client_name, service_type, client_user_id")
      .eq("request_id", REQUEST_ID)
      .maybeSingle();

    if (bookingError) throw bookingError;
    if (!booking || !isExpectedBooking(booking) || !booking.client_user_id) {
      return respond(req, { error: "The verified Pathseeker site-visit booking was not found or is not linked to its client account." }, 409);
    }

    const fields = {
      scheduled_date: "2026-11-17",
      status: "completed",
      visit_notes: REPORT_TEXT,
      completed_at: "2026-11-17T00:00:00+05:30",
      updated_at: new Date().toISOString(),
    };
    const { data: existingVisit, error: existingError } = await supabase
      .from("site_visits")
      .select("id")
      .eq("booking_id", booking.id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingVisit) {
      const { data, error } = await supabase
        .from("site_visits")
        .update(fields)
        .eq("id", existingVisit.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Supabase did not confirm the existing site visit update.");
    } else {
      const { data, error } = await supabase
        .from("site_visits")
        .insert({ booking_id: booking.id, staff_id: authData.user.id, ...fields })
        .select("id")
        .maybeSingle();

      if (error?.code === "23505") {
        const { data: concurrentVisit, error: concurrentError } = await supabase
          .from("site_visits")
          .select("id")
          .eq("booking_id", booking.id)
          .maybeSingle();
        if (concurrentError) throw concurrentError;
        if (!concurrentVisit) throw error;
        const { data: updated, error: updateError } = await supabase
          .from("site_visits")
          .update(fields)
          .eq("id", concurrentVisit.id)
          .select("id")
          .maybeSingle();
        if (updateError) throw updateError;
        if (!updated) throw new Error("Supabase did not confirm the concurrent site visit update.");
      } else {
        if (error) throw error;
        if (!data) throw new Error("Supabase did not confirm the site visit insert.");
      }
    }

    return respond(req, { saved: true, request_id: REQUEST_ID });
  } catch (error) {
    console.error("Pathseeker site visit operation failed:", error);
    return respond(req, { error: "Supabase could not complete the site visit operation." }, 500);
  }
});
