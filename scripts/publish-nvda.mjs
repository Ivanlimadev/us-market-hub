#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

(async () => {
  try {
    console.log("📖 Reading article...");
    const content = fs.readFileSync("/tmp/nvda_article.md", "utf-8");

    const post = {
      slug: "nvidia-stock-analysis-2026",
      title: "Nvidia Stock Analysis 2026: NVDA Valuation, Earnings & Buy Rating",
      excerpt:
        "Is Nvidia a generational buy or a bubble? Deep dive into NVDA's competitive moat, valuation, and whether it's worth the price.",
      content,
      category: "Stocks",
      image_url:
        "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=1200&q=80",
      image_alt: "Nvidia CEO Jensen Huang",
      status: "published",
      published_at: new Date().toISOString(),
      tickers: ["NVDA"],
      seo_title: "Nvidia Stock Analysis 2026: NVDA Valuation, Earnings & Buy Rating",
      seo_description:
        "Is NVDA a BUY? Comprehensive analysis of Nvidia valuation, earnings growth, competitive moat, and risks for 2026 investors.",
    };

    console.log("🚀 Publishing to Supabase...");
    const { data, error } = await supabase
      .from("blog_posts")
      .insert([post])
      .select();

    if (error) {
      console.error("❌ Error:", error.message);
      console.error("Details:", error);
      process.exit(1);
    }

    console.log("✅ Article published successfully!");
    console.log("");
    console.log("📊 Article Details:");
    console.log(`   Slug: ${data[0].slug}`);
    console.log(`   Title: ${data[0].title}`);
    console.log(`   Category: ${data[0].category}`);
    console.log(`   Tickers: ${data[0].tickers.join(", ")}`);
    console.log(`   Published: ${data[0].published_at}`);
    console.log("");
    console.log("🌐 URL: https://stockmarketroi.com/blog/nvidia-stock-analysis-2026");
    console.log("");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
