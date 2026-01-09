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
    const { message, language, conversationHistory } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ success: false, error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const languageInstruction = language === 'hi' 
      ? 'Respond in Hindi (हिंदी).'
      : language === 'ta'
      ? 'Respond in Tamil (தமிழ்).'
      : language === 'te'
      ? 'Respond in Telugu (తెలుగు).'
      : language === 'kn'
      ? 'Respond in Kannada (ಕನ್ನಡ).'
      : language === 'mr'
      ? 'Respond in Marathi (मराठी).'
      : language === 'bn'
      ? 'Respond in Bengali (বাংলা).'
      : language === 'pa'
      ? 'Respond in Punjabi (ਪੰਜਾਬੀ).'
      : 'Respond in English.';

    const systemPrompt = `You are AgriBot, a friendly and knowledgeable agricultural assistant specializing in weed detection and management. Your role is to help farmers with:

1. Understanding different types of weeds and how to identify them
2. Providing remedies and control methods for various weeds
3. Explaining how to use the AgriScan AI weed detection system
4. Offering general agricultural advice related to weed management
5. Answering questions about crop protection and farming best practices

Guidelines:
- Be concise and practical in your responses
- Use simple language that farmers can easily understand
- Provide specific, actionable advice
- Be encouraging and supportive
- ${languageInstruction}
- Keep responses under 200 words unless detailed explanation is needed

Common weed remedies you should know:
- Manual removal: Best for small infestations, remove before seeding
- Herbicides: Selective (targets specific weeds) vs Non-selective (kills all plants)
- Mulching: Organic mulch prevents weed growth and retains moisture
- Crop rotation: Breaks weed cycles and improves soil health
- Cover cropping: Suppresses weeds naturally
- Proper spacing: Reduces weed competition for resources`;

    // Build conversation messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to get response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ success: true, response: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
