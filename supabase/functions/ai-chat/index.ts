// AI shopping agent — uses Lovable AI Gateway with tool calling to search Shopify.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const STORE_DOMAIN = Deno.env.get("SHOPIFY_STORE_DOMAIN");
const STOREFRONT_TOKEN = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");

const ALLOWED_CATEGORIES = [
  "over-ear headphones",
  "in-ear headphones",
  "sunscreen",
  "facewash",
  "serum",
  "gel",
  "moisturizer",
  "snowboards",
  "gift card",
];

const SYSTEM_PROMPT = `You are ShopSense, an AI shopping assistant for a Shopify store.

THE STORE ONLY SELLS THESE CATEGORIES:
- over-ear headphones
- in-ear headphones
- sunscreen
- facewash
- serum
- gel
- moisturizer (skincare)
- snowboards
- gift cards

PRICING: All prices in the store are quoted in Indian Rupees (₹). When the user gives a budget like "under ₹2000", pass that exact number as maxPriceUsd to the search tool (the store stores INR values in the USD field). Always show prices to the user with the ₹ symbol.

STRICT RULES:
1. NEVER invent products. Only recommend products returned by the search_products tool.
2. If user asks for something OUTSIDE the store's categories (e.g., shoes, phones, laptops, t-shirts), politely tell them what the store DOES sell (headphones, skincare, snowboards, gift cards) and suggest the closest category.
3. Understand intent deeply. If the request is vague ("I want headphones"), ask ONE smart follow-up (over-ear vs in-ear? gaming/music/calls? wireless?). Do not ask more than one question at a time. Do not ask follow-ups if the request is already specific.
4. Respect strict constraints: budget, category, use-case. If the user mentions sunscreen, ONLY search sunscreen — never substitute another skincare product.
5. After getting results, RECOMMEND THE TOP 1-2 with clear reasoning ("Best for you because…"). Compare on dimensions that matter (price, features, ingredients, tags). Reference products by their EXACT title.
6. Handle tradeoffs explicitly (price vs quality, availability vs preference).
7. If NO results match, suggest a fallback: increase budget, try a related category, or remove a constraint. Never lie that products exist.
8. Remember user preferences across the conversation (last category, budget, use-case). When user says "show cheaper ones" or "any in red?", apply to the previous category/constraint.
9. Keep responses concise (3-6 sentences max). Use markdown bullets for product comparisons. Always speak in Indian Rupees (₹).
10. Always end with a clear next step ("Add to cart?", "Want me to find alternatives?").`;

const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search the Shopify store for products. Use this to find real products before recommending.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ALLOWED_CATEGORIES,
            description: "The product category to search. Pick the most specific one.",
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Optional keywords to refine search (e.g., 'wireless', 'gaming', 'spf 50').",
          },
          maxPriceUsd: {
            type: "number",
            description: "Maximum price in USD. Convert from INR by dividing by 83.",
          },
          limit: { type: "number", description: "Max products (default 8, max 12)." },
        },
        required: ["category"],
        additionalProperties: false,
      },
    },
  },
];

async function searchShopify(args: any) {
  const baseUrl = Deno.env.get("SUPABASE_URL");
  const res = await fetch(`${baseUrl}/functions/v1/shopify-search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? ""}`,
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conversation: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    let collectedProducts: any[] = [];
    let finalText = "";

    // Tool-calling loop (max 3 iterations)
    for (let i = 0; i < 3; i++) {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: conversation,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!aiRes.ok) {
        const t = await aiRes.text();
        if (aiRes.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiRes.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error ${aiRes.status}: ${t}`);
      }

      const data = await aiRes.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) throw new Error("No message in AI response");

      conversation.push(msg);

      const toolCalls = msg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        finalText = msg.content || "";
        break;
      }

      // Execute tool calls
      for (const tc of toolCalls) {
        if (tc.function?.name === "search_products") {
          let args: any = {};
          try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
          const result = await searchShopify(args);
          if (result?.products?.length) {
            // Dedupe by id across calls
            const ids = new Set(collectedProducts.map((p) => p.id));
            for (const p of result.products) if (!ids.has(p.id)) { collectedProducts.push(p); ids.add(p.id); }
          }
          conversation.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              count: result?.products?.length || 0,
              products: (result?.products || []).slice(0, 8).map((p: any) => ({
                id: p.id,
                title: p.title,
                priceInr: Math.round(p.price), // store reports INR-scale numbers in USD field
                productType: p.productType,
                tags: p.tags,
                available: p.available,
                description: (p.description || "").slice(0, 160),
              })),
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ reply: finalText, products: collectedProducts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
