export default async function handler(req, res) {
  // Allow requests from your website
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { query } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `You are a deal aggregator AI. Generate exactly 9 realistic product deals for: "${query}"

Return ONLY a raw JSON array. No markdown. No explanation. Just the JSON array.

Each object must have these exact fields:
- name: string (specific product name with brand, max 65 chars)
- store: string (one of: Amazon, Walmart, Target, Macy's, eBay, Nordstrom, Best Buy, Etsy, Costco, Zappos)
- price: number (realistic sale price)
- originalPrice: number (original price, 20-55% higher than price)
- rating: number (between 3.8 and 4.9, one decimal place)
- shipping: string (e.g. "Free shipping" or "Free 2-day shipping")
- emoji: string (single relevant emoji)
- color1: string (warm light hex like #f0e8dc)
- color2: string (slightly different warm hex like #e8dcd0)
- badge: string or null ("Best Seller","Hot Deal","Editor's Pick","#1 Rated", or null)
- amazonSearch: string (3-5 word Amazon search term for this product)

Make deals realistic and varied. Include well known brands.`
        }]
      })
    });

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    const match = text.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON found");
    const deals = JSON.parse(match[0]);

    return res.status(200).json({ deals });

  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch deals" });
  }
}
