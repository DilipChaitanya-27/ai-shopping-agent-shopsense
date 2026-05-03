// Shopify Storefront API proxy. Returns normalized products for a given category/intent.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const STORE_DOMAIN = Deno.env.get("SHOPIFY_STORE_DOMAIN");
const STOREFRONT_TOKEN = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");

const QUERY = `
  query Search($query: String!, $first: Int!) {
    products(first: $first, query: $query, sortKey: BEST_SELLING) {
      edges {
        node {
          id
          handle
          title
          description
          productType
          tags
          availableForSale
          onlineStoreUrl
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
          variants(first: 1) { edges { node { id availableForSale } } }
        }
      }
    }
  }
`;

type Normalized = {
  id: string;
  variantId?: string;
  title: string;
  description: string;
  handle: string;
  image: string;
  price: number;
  currency: string;
  url: string;
  productType: string;
  tags: string[];
  available: boolean;
};

function buildShopifyQuery(input: {
  category?: string | null;
  keywords?: string[];
  available?: boolean;
}): { query: string; titleMust?: string[]; descMust?: string[] } {
  const parts: string[] = [];
  const cat = (input.category || "").toLowerCase().trim();
  // STRICT categories: post-filter to require keyword in title or description.
  const catMap: Record<string, { terms: string[]; titleMust?: string[]; descMust?: string[] }> = {
    "over-ear headphones": { terms: ['product_type:Headphones'], titleMust: ["over-ear", "over ear"], descMust: ["over-ear", "over ear"] },
    "in-ear headphones":   { terms: ['product_type:Headphones'], titleMust: ["in-ear", "in ear", "earbud"], descMust: ["in-ear", "earbud"] },
    "headphones":          { terms: ['product_type:Headphones', 'tag:headphones', 'title:headphones'] },
    "sunscreen":           { terms: ['title:sunscreen OR title:spf OR tag:sunscreen'], titleMust: ["sunscreen", "spf", "sun "], descMust: ["sunscreen", "spf", "sun protect"] },
    "facewash":            { terms: ['title:"face wash" OR title:facewash OR title:cleanser OR tag:"face wash"'], titleMust: ["face wash", "facewash", "cleanser"] },
    "face wash":           { terms: ['title:"face wash" OR title:facewash OR title:cleanser'], titleMust: ["face wash", "facewash", "cleanser"] },
    "serum":               { terms: ['title:serum OR tag:serum'], titleMust: ["serum"] },
    "gel":                 { terms: ['title:gel OR tag:gel'], titleMust: ["gel"] },
    "moisturizer":         { terms: ['title:moisturizer OR title:moisturiser OR title:moisturising OR tag:moisturizer'], titleMust: ["moistur"] },
    "moisturizers":        { terms: ['title:moisturizer OR title:moisturiser OR tag:moisturizer'], titleMust: ["moistur"] },
    "skincare":            { terms: ['product_type:Skincare OR tag:skincare'] },
    "snowboard":           { terms: ['product_type:Snowboard OR title:snowboard'], titleMust: ["snowboard"] },
    "snowboards":          { terms: ['product_type:Snowboard OR title:snowboard'], titleMust: ["snowboard"] },
    "giftcard":            { terms: ['product_type:"Gift Cards" OR title:"gift card"'], titleMust: ["gift card", "giftcard"] },
    "gift card":           { terms: ['product_type:"Gift Cards" OR title:"gift card"'], titleMust: ["gift card", "giftcard"] },
  };
  const entry = catMap[cat];
  let titleMust: string[] | undefined;
  let descMust: string[] | undefined;
  if (entry) {
    parts.push("(" + entry.terms.join(" OR ") + ")");
    titleMust = entry.titleMust;
    descMust = entry.descMust;
  } else if (input.keywords && input.keywords.length) {
    parts.push("(" + input.keywords.map((k) => `title:*${k}*`).join(" OR ") + ")");
  }

  if (input.available !== false) parts.push("available_for_sale:true");

  return { query: parts.join(" AND ") || "*", titleMust, descMust };
}

async function fetchProducts(query: string, first = 12): Promise<Normalized[]> {
  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error("Shopify credentials not configured");
  }
  const endpoint = `https://${STORE_DOMAIN}/api/2024-10/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query: QUERY, variables: { query, first } }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Shopify error ${res.status}: ${t}`);
  }
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const edges = json?.data?.products?.edges ?? [];
  return edges.map((e: any) => {
    const n = e.node;
    return {
      id: n.id,
      variantId: n.variants?.edges?.[0]?.node?.id,
      title: n.title,
      description: (n.description || "").slice(0, 300),
      handle: n.handle,
      image: n.featuredImage?.url || "",
      price: parseFloat(n.priceRange?.minVariantPrice?.amount || "0"),
      currency: n.priceRange?.minVariantPrice?.currencyCode || "USD",
      url: n.onlineStoreUrl || `https://${STORE_DOMAIN}/products/${n.handle}`,
      productType: n.productType || "",
      tags: n.tags || [],
      available: !!n.availableForSale,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { category, keywords, maxPriceUsd, available, limit } = body || {};
    const { query: q, titleMust, descMust } = buildShopifyQuery({ category, keywords, available });
    // Fetch a larger pool to allow strict post-filter, then trim to requested limit
    const requested = Math.min(Math.max(Number(limit) || 12, 1), 24);
    let products = await fetchProducts(q, Math.min(requested * 2, 24));

    // Strict post-filter: must contain titleMust keyword in title OR descMust keyword in description
    if (titleMust && titleMust.length) {
      const tm = titleMust.map((s) => s.toLowerCase());
      const dm = (descMust || []).map((s) => s.toLowerCase());
      products = products.filter((p) => {
        const t = (p.title || "").toLowerCase();
        const d = (p.description || "").toLowerCase();
        return tm.some((k) => t.includes(k)) || dm.some((k) => d.includes(k));
      });
    }

    if (typeof maxPriceUsd === "number" && maxPriceUsd > 0) {
      products = products.filter((p) => p.price <= maxPriceUsd);
    }

    // Dedupe
    const seen = new Set();
    products = products.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));
    products = products.slice(0, requested);

    return new Response(JSON.stringify({ products, query: q }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("shopify-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", products: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
