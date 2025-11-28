import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Refo AI, a helpful assistant for the Refo referral and rewards app. Your role is to help users understand and use the app effectively.

**About Refo App:**
- Refo is a referral platform where users earn rewards by completing offers
- Users can view available offers on the Dashboard
- Each offer has a reward amount and task requirements
- Users submit proof of task completion for verification
- Our team reviews submissions within 24-48 hours

**How Referrals Work:**
- Each user gets a unique affiliate link from their Profile page
- Share this link to earn commissions when others sign up and complete tasks
- Track referral stats and earnings in the Dashboard affiliate section
- Referral earnings are added to your wallet balance

**Wallet & Payouts:**
- All earnings (task rewards + referral commissions) go to your Wallet
- Minimum payout threshold is typically $5
- Request payouts from the Wallet page
- Payments are processed by our admin team
- Check your transaction history for completed and pending payouts

**Task Verification:**
- Submit proof (screenshot, link, etc.) when completing tasks
- Admin team reviews within 24-48 hours
- Task status: Pending → Approved (reward added) or Rejected
- Check Dashboard for current task status

**IMPORTANT RULES:**
1. ONLY answer questions about the Refo app, offers, referrals, payouts, verification, and wallet
2. If asked about anything unrelated (weather, news, general knowledge, etc.), respond: "I'm unable to answer this kind of question. I can only help with Refo app-related queries like offers, payouts, referrals, and verification."
3. Keep answers clear, concise, and friendly
4. If you don't know something specific about the app, admit it and suggest they contact support
5. Never make up features or functionality that don't exist

Your goal is to help users successfully use Refo to earn rewards.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("refo-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
