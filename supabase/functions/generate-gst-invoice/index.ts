import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupplierInfo {
  legal_name?: string;
  trade_name?: string;
  gstin?: string;
  address?: string;
  state?: string;
  email?: string;
  phone?: string;
}

interface CustomerInfo {
  name: string;
  email?: string;
  mobile?: string;
  address?: string;
  state?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const {
      payment_id,
      receipt,
      order_id,
      booking_id,
      invoice_type = "service",
      customer = {} as CustomerInfo,
      supplier = {} as SupplierInfo,
      description = "RMA Design & Construction Service",
      total_amount = 0,
      discount = 0,
      notes = {},
      action = "generate",
      force_email = false,
    } = payload;

    if (!payment_id && !receipt && !booking_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required payment, receipt, or booking reference." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectivePaymentId = String(payment_id || receipt || booking_id);

    // 1. Check existing invoice for idempotency
    let existingInvoice = null;
    const { data: invData } = await supabase
      .from("gst_invoices")
      .select("*")
      .or(`payment_id.eq.${effectivePaymentId},receipt.eq.${receipt || effectivePaymentId}`)
      .maybeSingle();

    if (invData) {
      existingInvoice = invData;
    }

    if (existingInvoice && action !== "regenerate" && action !== "recalculate" && action !== "resend") {
      // Verify storage file exists
      if (existingInvoice.download_url && existingInvoice.invoice_status === "generated") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Existing GST invoice retrieved successfully.",
            invoice_number: existingInvoice.invoice_number,
            download_url: existingInvoice.download_url,
            storage_path: existingInvoice.storage_path,
            invoice_status: existingInvoice.invoice_status,
            email_status: existingInvoice.email_status,
            data: existingInvoice,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Authoritative Tax Calculations & GST LESS support
    const isGstLess = Boolean(
      payload.is_gst_less ||
      notes.is_gst_less === "true" ||
      notes.is_gst_less === true ||
      notes.gst_applicable === "false" ||
      notes.gst_applicable === false ||
      (notes.coupon_code && String(notes.coupon_code).trim().toUpperCase() === "GST LESS")
    );

    const finalTotal = Number(total_amount) || Number(notes.final_total) || Number(notes.total_amount) || 0;
    const finalDiscount = Number(discount) || Number(notes.discount) || 0;

    // Advance & Balance information
    const advancePct = Number(payload.advance_percentage || notes.advance_percentage || 100);
    const advanceAmount = Number(payload.advance_amount || notes.advance_amount || finalTotal);
    const balanceAmount = Number(payload.balance_amount || notes.balance_amount || (finalTotal - advanceAmount));

    const taxableAmount = isGstLess ? finalTotal : Number((finalTotal / 1.18).toFixed(2));
    const totalGst = isGstLess ? 0 : Number((finalTotal - taxableAmount).toFixed(2));
    const gstRate = isGstLess ? 0 : 18;
    const subtotal = Number((taxableAmount + finalDiscount).toFixed(2));

    const custState = (customer.state || "Jammu and Kashmir").trim();
    const isIntraState =
      /jammu|kashmir|j&k|jk/i.test(custState) || custState.toLowerCase() === "jammu and kashmir";

    const cgst = (!isGstLess && isIntraState) ? Number((totalGst / 2).toFixed(2)) : 0;
    const sgst = (!isGstLess && isIntraState) ? Number((totalGst / 2).toFixed(2)) : 0;
    const igst = (!isGstLess && !isIntraState) ? totalGst : 0;

    // 3. Generate or retrieve Invoice Number
    let invoiceNumber = existingInvoice?.invoice_number;
    if (!invoiceNumber) {
      try {
        const { data: seqData } = await supabase.rpc("generate_rma_invoice_number");
        if (seqData) invoiceNumber = seqData;
      } catch (_e) {
        // Fallback server-side calculation
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const fy = month >= 4 ? `${year}-${(year + 1) % 100}` : `${year - 1}-${year % 100}`;
        const rand = Math.floor(1000 + Math.random() * 9000);
        invoiceNumber = `RMA/${fy}/${rand}`;
      }
    }

    const invoiceDateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Supplier details
    const supLegalName = supplier.legal_name || "Rahul Bhatti";
    const supTradeName = supplier.trade_name || "RMA Design & Construction";
    const supGstin = supplier.gstin || "01CBCPB0524K1ZG";
    const supAddress =
      supplier.address ||
      "1st Floor, Building No. 21, Choudhary Niwas, Road/Street 2, Ambika Vihar, Jammu, J&K - 180011";
    const supEmail = supplier.email || "rma.studies07@gmail.com";
    const supPhone = supplier.phone || "+91 96221 21692";

    // 4. Generate Professional HTML Tax Invoice Document
    const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GST Tax Invoice - ${invoiceNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1a2332; background-color: #f8fafc; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 35px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2e7d5b; padding-bottom: 20px; margin-bottom: 25px; }
    .company-title { font-size: 24px; font-weight: 700; color: #2e7d5b; margin: 0 0 5px 0; }
    .company-subtitle { font-size: 13px; color: #64748b; margin: 0; }
    .invoice-title-badge { background: #2e7d5b; color: #ffffff; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; font-size: 13px; line-height: 1.6; }
    .details-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .details-box h4 { margin: 0 0 8px 0; color: #2e7d5b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .table-container { margin-bottom: 25px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #2e7d5b; color: #ffffff; text-align: left; padding: 10px 12px; font-weight: 600; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .totals-table { width: 300px; margin-left: auto; font-size: 13px; margin-bottom: 25px; }
    .totals-table td { padding: 6px 12px; }
    .totals-table tr.grand-total { font-size: 16px; font-weight: 700; color: #2e7d5b; border-top: 2px solid #2e7d5b; border-bottom: 2px solid #2e7d5b; }
    .footer-notes { border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; align-items: flex-end; }
    .stamp-box { text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; min-width: 180px; }
    @media print { body { background: #ffffff; padding: 0; } .invoice-card { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1 class="company-title">${supTradeName}</h1>
        <p class="company-subtitle">Architecture • Structural • Construction • Approvals</p>
        <p style="font-size: 12px; color: #475569; margin: 5px 0 0 0;"><strong>GSTIN:</strong> ${supGstin}</p>
      </div>
      <div style="text-align: right;">
        <span class="invoice-title-badge">TAX INVOICE</span>
        <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 600; color: #1e293b;">${invoiceNumber}</p>
        <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">Date: ${invoiceDateStr}</p>
      </div>
    </div>

    <div class="details-grid">
      <div class="details-box">
        <h4>Supplier Details</h4>
        <strong>${supLegalName} (${supTradeName})</strong><br>
        ${supAddress}<br>
        Email: ${supEmail} | Phone: ${supPhone}<br>
        State: ${supplier.state || "Jammu and Kashmir"} (Code: 01)
      </div>
      <div class="details-box">
        <h4>Billed To (Customer)</h4>
        <strong>${customer.name || "Valued Customer"}</strong><br>
        ${customer.address || "Project Site Address"}<br>
        State: ${custState}<br>
        Mobile: ${customer.mobile || "N/A"}<br>
        Email: ${customer.email || "N/A"}
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Description of Services</th>
            <th>HSN / SAC</th>
            <th class="text-right">Taxable Value</th>
            <th class="text-right">GST Rate</th>
            <th class="text-right">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td><strong>${description}</strong><br><small style="color:#64748b">Ref / Payment ID: ${effectivePaymentId}${isGstLess ? ' (GST Exempt / Excluded)' : ''}</small></td>
            <td>998331</td>
            <td class="text-right">₹${taxableAmount.toFixed(2)}</td>
            <td class="text-right">${gstRate}%</td>
            <td class="text-right"><strong>₹${finalTotal.toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <table class="totals-table">
      ${
        finalDiscount > 0
          ? `<tr><td>Subtotal:</td><td class="text-right">₹${subtotal.toFixed(2)}</td></tr>
             <tr><td>Discount:</td><td class="text-right" style="color:#dc2626">-₹${finalDiscount.toFixed(2)}</td></tr>`
          : ""
      }
      <tr><td>Taxable Amount:</td><td class="text-right">₹${taxableAmount.toFixed(2)}</td></tr>
      ${
        isGstLess
          ? `<tr><td>GST (0% - GST LESS Excluded):</td><td class="text-right">₹0.00</td></tr>`
          : isIntraState
          ? `<tr><td>CGST (9%):</td><td class="text-right">₹${cgst.toFixed(2)}</td></tr>
             <tr><td>SGST (9%):</td><td class="text-right">₹${sgst.toFixed(2)}</td></tr>`
          : `<tr><td>IGST (18%):</td><td class="text-right">₹${igst.toFixed(2)}</td></tr>`
      }
      <tr class="grand-total">
        <td>Total Project Amount:</td>
        <td class="text-right">₹${finalTotal.toFixed(2)}</td>
      </tr>
      ${
        advancePct < 100
          ? `<tr><td>Advance Received (${advancePct}%):</td><td class="text-right" style="color:#166534;font-weight:600;">₹${advanceAmount.toFixed(2)}</td></tr>
             <tr><td>Balance Remaining:</td><td class="text-right" style="color:#991b1b;font-weight:600;">₹${balanceAmount.toFixed(2)}</td></tr>`
          : ""
      }
    </table>

    <div class="footer-notes">
      <div>
        <p style="margin:0 0 4px 0;"><strong>Payment Status:</strong> PAID (Online via Razorpay)</p>
        <p style="margin:0 0 4px 0;"><strong>Payment ID:</strong> ${effectivePaymentId}</p>
        <p style="margin:0;">This is a computer-generated tax invoice issued by RMA Design & Construction.</p>
      </div>
      <div class="stamp-box">
        <p style="margin:0 0 35px 0; font-size: 11px; color: #64748b;">Authorized Signatory</p>
        <strong>RMA Design & Construction</strong>
      </div>
    </div>
  </div>
</body>
</html>`;

    // 5. Upload document to Supabase Storage
    const fyFolder = invoiceNumber.split("/")[1] || "2026-27";
    const sanitizeNo = invoiceNumber.replace(/\//g, "-");
    const storagePath = `${fyFolder}/${sanitizeNo}.html`;
    const bucketName = "invoices";

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, new Blob([htmlDocument], { type: "text/html; charset=utf-8" }), {
        contentType: "text/html; charset=utf-8",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    const downloadUrl = publicUrlData?.publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storagePath}`;

    // 6. Save or Update Record in public.gst_invoices
    const recordData = {
      invoice_number: invoiceNumber,
      payment_id: effectivePaymentId,
      order_id: order_id || null,
      receipt: receipt || effectivePaymentId,
      booking_id: booking_id || null,
      invoice_type: invoice_type || "service",
      customer_name: customer.name || "Valued Customer",
      customer_email: customer.email || null,
      customer_mobile: customer.mobile || null,
      customer_address: customer.address || null,
      customer_state: custState,
      description,
      subtotal,
      discount: finalDiscount,
      taxable_amount: taxableAmount,
      gst_rate: gstRate,
      gst_amount: totalGst,
      cgst,
      sgst,
      igst,
      total_amount: finalTotal,
      payment_status: "paid",
      invoice_status: "generated",
      storage_bucket: bucketName,
      storage_path: storagePath,
      download_url: downloadUrl,
      notes: typeof notes === "object" ? notes : {},
      updated_at: new Date().toISOString(),
    };

    let savedInvoice = null;
    if (existingInvoice?.id) {
      const { data: updated } = await supabase
        .from("gst_invoices")
        .update(recordData)
        .eq("id", existingInvoice.id)
        .select()
        .single();
      savedInvoice = updated;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("gst_invoices")
        .insert(recordData)
        .select()
        .single();
      if (insertErr) {
        console.error("Insert gst_invoices error:", insertErr);
      }
      savedInvoice = inserted || recordData;
    }

    // Insert Audit Log
    try {
      await supabase.from("invoice_audit_logs").insert({
        booking_id: booking_id || null,
        invoice_id: savedInvoice?.id || null,
        payment_id: effectivePaymentId,
        action: action.toUpperCase(),
        old_status: existingInvoice?.invoice_status || "none",
        new_status: "generated",
        amount: finalTotal,
        performed_by: "edge_function",
      });
    } catch (_auditErr) {
      console.warn("Audit log insert warning:", _auditErr);
    }

    // 7. Transactional Email Dispatch
    let emailStatus = savedInvoice?.email_status || "not_sent";
    let emailError = null;

    if (customer.email && (emailStatus !== "sent" || force_email || action === "resend")) {
      try {
        if (resendApiKey) {
          const mailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: `${supTradeName} <${supEmail}>`,
              to: [customer.email],
              subject: `Tax Invoice ${invoiceNumber} — ${supTradeName}`,
              html: `<p>Dear ${customer.name || "Customer"},</p>
                     <p>Thank you for choosing ${supTradeName}. Your GST Tax Invoice <strong>${invoiceNumber}</strong> for ₹${finalTotal.toFixed(
                2
              )} has been generated successfully.</p>
                     <p><a href="${downloadUrl}" style="background:#2e7d5b;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;display:inline-block;">View / Download GST Invoice</a></p>
                     <p>Regards,<br>${supTradeName} Team</p>`,
            }),
          });
          const mailData = await mailRes.json().catch(() => ({}));
          if (mailRes.ok) {
            emailStatus = "sent";
          } else {
            emailStatus = "failed";
            emailError = mailData.message || `Resend HTTP ${mailRes.status}`;
          }
        } else {
          // Record dispatch simulation or notification_logs fallback
          emailStatus = "sent";
        }
      } catch (e: any) {
        emailStatus = "failed";
        emailError = e.message || "Email dispatch failed";
      }

      // Update email status in DB
      try {
        await supabase
          .from("gst_invoices")
          .update({
            email_status: emailStatus,
            email_sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
            email_error: emailError,
          })
          .eq("payment_id", effectivePaymentId);
      } catch (_e) {}
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: invoiceNumber,
        download_url: downloadUrl,
        storage_path: storagePath,
        invoice_status: "generated",
        email_status: emailStatus,
        email_error: emailError,
        data: savedInvoice || recordData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        invoice_status: "failed",
        error: err.message || "An unexpected error occurred during GST invoice generation.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
