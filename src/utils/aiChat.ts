import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

export async function streamAIChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    // 1. Check for client-side Gemini Key
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (geminiKey) {
      console.log("Using client-side Gemini API key");
      let response;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: {
                  parts: [{
                    text: `You are the official AI Support Assistant for the 'Refo' app. 
Your goal is to help users earn money by completing tasks, tracking rewards, and withdrawing earnings.

**Strict Rules:**
1. You must ONLY answer questions related to the Refo app, earning money on Refo, withdrawals, tasks, offers, and technical support for the app.
2. If a user asks about general topics (e.g., "Who is the president?", "Write code", "Weather", "Math", "Jokes"), you must politely REFUSE. Say: "I can only assist you with questions related to the Refo app and earning rewards."
3. Be helpful, friendly, and professional. Use emojis occasionally.
4. Keep answers concise and easy to read.

**App Knowledge Base:**
- **Currency:** Indian Rupee (₹).
- **Offers:** Users select offers (apps to download), follow instructions (e.g., "Install & Register"), and earn rewards.
- **Tasks:** After completing an offer, users must upload a screenshot proof in the "My Tasks" tab.
- **Wallet:** Tracks "Total Balance" and "Pending Balance".
- **Withdrawals:** 
    - Minimum withdrawal amount: ₹200.
    - Methods: UPI and Bank Transfer.
    - Processing time: Up to 48 hours.
- **Affiliate:** "Share & Earn" program is coming soon.
- **Issues:** If a user complains about missing rewards, ask if they uploaded the proof screenshot and if the status is "Pending" or "Rejected".

**User Context:**
- The user is currently chatting with you within the app.
- If they ask "How do I withdraw?", guide them to the Wallet tab.
- If they ask "How do I earn?", guide them to the Home/Offers tab.`
                  }]
                },
                contents: messages.map(m => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }]
                }))
              })
            }
          );

          if (response.status === 429) {
            console.log(`Gemini 429 Rate Limit. Retrying in ${(retryCount + 1) * 2}s...`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            continue;
          }

          break; // Success or other error
        } catch (e) {
          console.error("Fetch error:", e);
          retryCount++;
          if (retryCount >= maxRetries) throw e;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!response) throw new Error("Failed to connect to Gemini API");

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error Response:", errorText);
        let errorMessage = `Gemini API Error: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch (e) {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Gemini stream returns JSON objects, sometimes multiple per chunk
        // Format: [{ "candidates": [...] }]
        // We need to parse valid JSON objects from the buffer

        // Simple parsing strategy for Gemini stream (which is usually a JSON array or comma-separated objects)
        // Actually, streamGenerateContent returns a stream of JSON objects, not SSE.
        // It returns "[{...},\n{...}]" or similar.
        // Let's try a simpler approach: accumulate and find matching braces

        let openBrace = buffer.indexOf('{');
        while (openBrace !== -1) {
          let braceCount = 1;
          let closeBrace = -1;

          for (let i = openBrace + 1; i < buffer.length; i++) {
            if (buffer[i] === '{') braceCount++;
            else if (buffer[i] === '}') braceCount--;

            if (braceCount === 0) {
              closeBrace = i;
              break;
            }
          }

          if (closeBrace !== -1) {
            const jsonStr = buffer.slice(openBrace, closeBrace + 1);
            buffer = buffer.slice(closeBrace + 1); // Advance buffer

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) onDelta(text);
            } catch (e) {
              console.error("JSON parse error", e);
            }

            openBrace = buffer.indexOf('{');
          } else {
            break; // Wait for more data
          }
        }
      }

      onDone();
      return;
    }

    // 2. Fallback to Supabase Edge Function
    // Get the user's session token
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      onError("Please sign in to use the chat feature");
      return;
    }

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refo-chat`;

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        onError("Rate limit exceeded. Please try again in a moment.");
        return;
      }
      if (resp.status === 402) {
        onError("AI service unavailable. Please contact support.");
        return;
      }
      onError(errorData.error || "Failed to get AI response");
      return;
    }

    if (!resp.body) {
      onError("No response from AI service");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("AI chat error:", error);
    onError(error instanceof Error ? error.message : "Unknown error");
  }
}
