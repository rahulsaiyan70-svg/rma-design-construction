import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface DiagnosticResponse {
  connection_status: "connected" | "disconnected";
  token_refresh_status: "success" | "failed";
  api_status: "success" | "failed";
  organization_match: boolean;
  organization_name?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only GET or POST allowed for diagnostic check
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use GET or POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          connection_status: "disconnected",
          token_refresh_status: "failed",
          api_status: "failed",
          organization_match: false,
          error: "Supabase environment configuration missing.",
        } as DiagnosticResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate requesting user & enforce Admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid Authorization bearer token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;
    const userEmail = (userData.user.email || "").toLowerCase();

    // Check admin role in profiles table or known admin email pattern
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", userId)
      .maybeSingle();

    const isAdminRole = profile?.role === "admin" && profile?.active !== false;
    const isKnownAdminEmail = userEmail === "rma.studies07@gmail.com";

    if (!isAdminRole && !isKnownAdminEmail) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Administrator privileges required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Read the existing Zoho integration record securely
    const { data: zohoRecord, error: zohoErr } = await supabase
      .from("zoho_integration")
      .select("id, refresh_token, organization_id, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (zohoErr || !zohoRecord) {
      return new Response(
        JSON.stringify({
          connection_status: "disconnected",
          token_refresh_status: "failed",
          api_status: "failed",
          organization_match: false,
          error: "No Zoho integration record found in database.",
        } as DiagnosticResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const storedRefreshToken = zohoRecord.refresh_token;
    const storedOrgId = String(zohoRecord.organization_id || "").trim();

    if (!storedRefreshToken) {
      return new Response(
        JSON.stringify({
          connection_status: "disconnected",
          token_refresh_status: "failed",
          api_status: "failed",
          organization_match: false,
          error: "Zoho refresh token is missing in integration record.",
        } as DiagnosticResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Obtain OAuth credentials from Supabase secrets
    // Support common environment variable names for Zoho credentials
    const clientId =
      Deno.env.get("ZOHO_CLIENT_ID") ||
      Deno.env.get("ZOHO_BOOKS_CLIENT_ID") ||
      "";
    const clientSecret =
      Deno.env.get("ZOHO_CLIENT_SECRET") ||
      Deno.env.get("ZOHO_BOOKS_CLIENT_SECRET") ||
      "";

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          connection_status: "disconnected",
          token_refresh_status: "failed",
          api_status: "failed",
          organization_match: false,
          error: "Zoho OAuth client credentials not found in secrets.",
        } as DiagnosticResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Request a fresh access token using the stored refresh token
    // Zoho accounts endpoint (Indian DC accounts.zoho.in as used by the RMA Zoho setup)
    const zohoAccountsDomain = Deno.env.get("ZOHO_ACCOUNTS_DOMAIN") || "https://accounts.zoho.in";
    const tokenUrl = `${zohoAccountsDomain.replace(/\/+$/, "")}/oauth/v2/token`;

    const tokenParams = new URLSearchParams({
      refresh_token: storedRefreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    });

    let accessToken = "";
    try {
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams.toString(),
      });

      const tokenData = await tokenRes.json().catch(() => ({}));

      if (!tokenRes.ok || !tokenData.access_token) {
        const errorDesc =
          tokenData.error_description ||
          tokenData.error ||
          `Token refresh request failed with HTTP status ${tokenRes.status}`;
        return new Response(
          JSON.stringify({
            connection_status: "disconnected",
            token_refresh_status: "failed",
            api_status: "failed",
            organization_match: false,
            error: errorDesc,
          } as DiagnosticResponse),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = tokenData.access_token;
    } catch (_e) {
      return new Response(
        JSON.stringify({
          connection_status: "disconnected",
          token_refresh_status: "failed",
          api_status: "failed",
          organization_match: false,
          error: "Network error requesting Zoho access token.",
        } as DiagnosticResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Query Zoho Books API to retrieve organisation details
    const zohoApiDomain = Deno.env.get("ZOHO_BOOKS_API_DOMAIN") || "https://www.zohoapis.in";
    const orgsUrl = `${zohoApiDomain.replace(/\/+$/, "")}/books/v3/organizations`;

    let orgDetails: { organization_id?: string; name?: string } | null = null;

    try {
      const apiRes = await fetch(orgsUrl, {
        method: "GET",
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const apiData = await apiRes.json().catch(() => ({}));

      if (!apiRes.ok || apiData.code !== 0) {
        const apiError =
          apiData.message ||
          `Zoho Books API returned status ${apiRes.status}`;
        return new Response(
          JSON.stringify({
            connection_status: "disconnected",
            token_refresh_status: "success",
            api_status: "failed",
            organization_match: false,
            error: apiError,
          } as DiagnosticResponse),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const organizations: any[] = Array.isArray(apiData.organizations)
        ? apiData.organizations
        : [];

      // Find matching organization or the primary organization
      let matchedOrg = organizations.find(
        (o) => String(o.organization_id).trim() === storedOrgId
      );

      // If only one organization is returned and no exact id matched yet, test match
      if (!matchedOrg && organizations.length > 0) {
        matchedOrg = organizations[0];
      }

      if (matchedOrg) {
        orgDetails = {
          organization_id: String(matchedOrg.organization_id || ""),
          name: matchedOrg.name || matchedOrg.organization_name || "",
        };
      }
    } catch (_e) {
      return new Response(
        JSON.stringify({
          connection_status: "disconnected",
          token_refresh_status: "success",
          api_status: "failed",
          organization_match: false,
          error: "Network error calling Zoho Books organizations API.",
        } as DiagnosticResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Verify that the returned organisation ID matches the stored organisation_id
    const returnedOrgId = orgDetails?.organization_id || "";
    const isOrgMatch = Boolean(
      storedOrgId &&
      returnedOrgId &&
      storedOrgId === returnedOrgId
    );

    const isConnected = isOrgMatch && Boolean(orgDetails?.name);

    const responsePayload: DiagnosticResponse = {
      connection_status: isConnected ? "connected" : "disconnected",
      token_refresh_status: "success",
      api_status: "success",
      organization_match: isOrgMatch,
      organization_name: orgDetails?.name,
    };

    if (!isOrgMatch) {
      responsePayload.error = "Organization ID mismatch between stored record and Zoho Books.";
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    // Return sanitized diagnostic error without exposing stack or secrets
    const safeErrorMsg =
      typeof err?.message === "string"
        ? err.message.replace(/[a-zA-Z0-9_\-\.]{30,}/g, "[REDACTED]")
        : "An unexpected error occurred during Zoho connection diagnostic.";

    return new Response(
      JSON.stringify({
        connection_status: "disconnected",
        token_refresh_status: "failed",
        api_status: "failed",
        organization_match: false,
        error: safeErrorMsg,
      } as DiagnosticResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
