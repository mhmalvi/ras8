
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0?dts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  type: 'return_status' | 'ai_suggestion' | 'return_approved' | 'return_rejected' | 'exchange_offer';
  recipientEmail: string;
  customerName?: string;
  returnId: string;
  orderNumber?: string;
  status?: string;
  aiSuggestion?: string;
  reason?: string;
  merchantName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const {
      type,
      recipientEmail,
      customerName = "Customer",
      returnId,
      orderNumber,
      status,
      aiSuggestion,
      reason,
      merchantName = "Your Store"
    }: EmailNotificationRequest = await req.json();

    let subject: string;
    let htmlContent: string;

    switch (type) {
      case 'return_status':
        subject = `Return Update - Order ${orderNumber || returnId}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1D4ED8;">Return Status Update</h2>
            <p>Dear ${customerName},</p>
            <p>Your return request for Order ${orderNumber || returnId} has been updated.</p>
            <div style="background: #F8FAFC; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong>New Status:</strong> ${status}
              ${reason ? `<br><strong>Reason:</strong> ${reason}` : ''}
            </div>
            <p>We'll keep you updated on any further changes to your return.</p>
            <p>Best regards,<br>${merchantName} Team</p>
          </div>
        `;
        break;

      case 'ai_suggestion':
        subject = `Smart Exchange Suggestion - Order ${orderNumber || returnId}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7C3AED;">AI-Powered Exchange Suggestion</h2>
            <p>Dear ${customerName},</p>
            <p>We've found a perfect alternative for your return request!</p>
            <div style="background: #F3E8FF; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #7C3AED;">
              <strong>Smart Recommendation:</strong><br>
              ${aiSuggestion}
            </div>
            <p>This suggestion is based on your preferences and our AI analysis. Would you like to exchange instead of returning?</p>
            <p>Best regards,<br>${merchantName} Team</p>
          </div>
        `;
        break;

      case 'return_approved':
        subject = `Return Approved - Order ${orderNumber || returnId}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Return Approved ✓</h2>
            <p>Dear ${customerName},</p>
            <p>Great news! Your return request has been approved.</p>
            <div style="background: #ECFDF5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #10B981;">
              <strong>Order:</strong> ${orderNumber || returnId}<br>
              <strong>Status:</strong> Approved
            </div>
            <p>Please follow the return instructions sent to process your return.</p>
            <p>Best regards,<br>${merchantName} Team</p>
          </div>
        `;
        break;

      case 'return_rejected':
        subject = `Return Update - Order ${orderNumber || returnId}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #EF4444;">Return Request Update</h2>
            <p>Dear ${customerName},</p>
            <p>We've reviewed your return request for Order ${orderNumber || returnId}.</p>
            <div style="background: #FEF2F2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #EF4444;">
              <strong>Status:</strong> Unable to process<br>
              ${reason ? `<strong>Reason:</strong> ${reason}` : ''}
            </div>
            <p>If you have any questions, please contact our customer service team.</p>
            <p>Best regards,<br>${merchantName} Team</p>
          </div>
        `;
        break;

      case 'exchange_offer':
        subject = `Exchange Offer Available - Order ${orderNumber || returnId}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #F59E0B;">Exchange Opportunity</h2>
            <p>Dear ${customerName},</p>
            <p>We'd like to offer you an exchange option for your return request.</p>
            <div style="background: #FFFBEB; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #F59E0B;">
              <strong>Exchange Option:</strong><br>
              ${aiSuggestion || 'Alternative product available'}
            </div>
            <p>This might be a better fit for your needs. Let us know if you're interested!</p>
            <p>Best regards,<br>${merchantName} Team</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "Returns Team <noreply@resend.dev>",
      to: [recipientEmail],
      subject,
      html: htmlContent,
    });

    // Log the email notification
    await supabaseClient.from('analytics_events').insert({
      event_type: 'email_notification_sent',
      event_data: {
        email_type: type,
        recipient: recipientEmail,
        return_id: returnId,
        email_id: emailResponse.data?.id
      }
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
