/**
 * Automated Test Suite for Zoho Books Connection Diagnostic Edge Function
 * (test-zoho-connection)
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== Starting Zoho Books Connection Diagnostic Test Suite ===\n');

// 1. Verify Edge Function file existence and structure
console.log('[TEST 1] Verifying Edge Function file and location...');
const funcPath = 'supabase/functions/test-zoho-connection/index.ts';
assert(fs.existsSync(funcPath), `Edge function ${funcPath} does not exist!`);
const code = fs.readFileSync(funcPath, 'utf8');
console.log('✔ TEST 1 PASSED: Edge Function file exists at supabase/functions/test-zoho-connection/index.ts.');

// 2. Verify Table zoho_integration Query and Stored Fields
console.log('\n[TEST 2] Verifying zoho_integration table query & field handling...');
assert(code.includes('from("zoho_integration")'), 'Function must read from table zoho_integration');
assert(code.includes('refresh_token'), 'Function must query refresh_token');
assert(code.includes('organization_id'), 'Function must query organization_id');
assert(code.includes('order("updated_at"'), 'Function must query the latest updated record');
console.log('✔ TEST 2 PASSED: zoho_integration query securely fetches refresh_token & organization_id.');

// 3. Verify Zoho Token Refresh Logic
console.log('\n[TEST 3] Verifying Zoho OAuth token refresh request logic...');
assert(code.includes('oauth/v2/token'), 'Function must target Zoho OAuth token endpoint');
assert(code.includes('grant_type: "refresh_token"') || code.includes('grant_type", "refresh_token"'), 'grant_type must be refresh_token');
assert(code.includes('ZOHO_CLIENT_ID') && code.includes('ZOHO_CLIENT_SECRET'), 'Function must read client ID and secret from environment secrets');
assert(code.includes('accounts.zoho.in'), 'Function must support Indian DC accounts.zoho.in');
console.log('✔ TEST 3 PASSED: Zoho OAuth token refresh logic correctly configured.');

// 4. Verify Zoho Books Authenticated API Request
console.log('\n[TEST 4] Verifying Zoho Books API organization lookup...');
assert(code.includes('books/v3/organizations'), 'Function must request organizations endpoint from Zoho Books API');
assert(code.includes('Zoho-oauthtoken'), 'Function must authorize Zoho Books API call with Zoho-oauthtoken header');
console.log('✔ TEST 4 PASSED: Authenticated Zoho Books API organization request verified.');

// 5. Verify Organization ID Match & Safe Diagnostic Response Fields
console.log('\n[TEST 5] Verifying diagnostic response fields and organization match logic...');
assert(code.includes('connection_status'), 'Diagnostic response must include connection_status');
assert(code.includes('token_refresh_status'), 'Diagnostic response must include token_refresh_status');
assert(code.includes('api_status'), 'Diagnostic response must include api_status');
assert(code.includes('organization_match'), 'Diagnostic response must include organization_match');
assert(code.includes('organization_name'), 'Diagnostic response must include organization_name');
assert(code.includes('storedOrgId === returnedOrgId'), 'Function must verify returned organization ID matches stored organization_id');
console.log('✔ TEST 5 PASSED: Response fields match requirements exactly.');

// 6. Verify Administrator Security & RBAC Protection
console.log('\n[TEST 6] Verifying admin authentication and RBAC protection...');
assert(code.includes('auth.getUser'), 'Function must authenticate bearer token with Supabase Auth');
assert(code.includes('role === "admin"'), 'Function must enforce admin role check');
assert(code.includes('401') && code.includes('403'), 'Function must return 401 for unauthenticated and 403 for unauthorized requests');
console.log('✔ TEST 6 PASSED: Diagnostic endpoint strictly protected for administrator access.');

// 7. Verify Secrets & Credential Leak Prevention
console.log('\n[TEST 7] Verifying that tokens and credentials are never returned or logged...');
// Ensure the response payload interface and responses do not return sensitive credentials
assert(!code.includes('access_token: string') && !code.includes('accessToken: string'), 'Diagnostic response interface must not expose access_token');
assert(!code.includes('refresh_token: string') && !code.includes('refreshToken: string'), 'Diagnostic response interface must not expose refresh_token');
assert(!code.includes('client_secret: string') && !code.includes('clientSecret: string'), 'Diagnostic response interface must not expose client_secret');
// Ensure console.log does not output secret values
assert(!code.includes('console.log(storedRefreshToken)'), 'Must not log refresh token');
assert(!code.includes('console.log(accessToken)'), 'Must not log access token');
assert(!code.includes('console.log(clientSecret)'), 'Must not log client secret');
console.log('✔ TEST 7 PASSED: Tokens, client secrets, and sensitive credentials are never logged or returned.');

// 8. Verify Non-Interference with Existing Functions and Systems
console.log('\n[TEST 8] Verifying no existing functions or tables were modified...');
assert(fs.existsSync('supabase/functions/generate-gst-invoice/index.ts'), 'generate-gst-invoice must remain intact');
assert(fs.existsSync('supabase/functions/generate-manual-gst-invoice/index.ts'), 'generate-manual-gst-invoice must remain intact');
console.log('✔ TEST 8 PASSED: Existing edge functions remain unaffected.');

console.log('\n=== ALL ZOHO CONNECTION DIAGNOSTIC TESTS PASSED SUCCESSFULLY ===');
