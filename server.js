const express = require("express");
const Parser = require("rss-parser");

const app = express();
const parser = new Parser();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

const categories = {
  terkini: {
    name: "Semua Berita",
    urls: [
      "https://www.cnnindonesia.com/teknologi/rss",
      "https://www.cnnindonesia.com/nasional/rss",
      "https://www.cnnindonesia.com/ekonomi/rss",
      "https://www.antaranews.com/terkini/rss",
    ],
  },
  teknologi: {
    name: "Teknologi",
    urls: ["https://www.cnnindonesia.com/teknologi/rss"],
  },
  ekonomi: {
    name: "Ekonomi",
    urls: ["https://www.cnnindonesia.com/ekonomi/rss"],
  },
  nasional: {
    name: "Nasional",
    urls: [
      "https://www.cnnindonesia.com/nasional/rss",
      "https://www.antaranews.com/politik/rss",
    ],
  },
};

function extractImage(article) {
  if (article.enclosure && article.enclosure.url) return article.enclosure.url;
  const content = article.content || article["content:encoded"] || "";
  const match = content.match(/<img[^>]+src="([^">]+)"/);
  if (match && match[1]) return match[1];
  return "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=60";
}

app.get("/", async (req, res) => {
  try {
    const catKey = req.query.category || "terkini";
    const searchQuery = (req.query.q || "").toLowerCase();
    const currentCategory = categories[catKey]
      ? categories[catKey]
      : categories["terkini"];

    let allArticles = [];

    for (const url of currentCategory.urls) {
      try {
        let feed = await parser.parseURL(url);
        let items = feed.items.map((article) => ({
          ...article,
          sourceName: feed.title || "Portal Berita",
          imageUrl: extractImage(article),
          pubDateParsed: new Date(article.pubDate || Date.now()),
        }));
        allArticles.push(...items);
      } catch (err) {
        console.log(`Gagal ambil dari URL: ${url}`);
      }
    }

    // Urutkan berita dari yang terbaru
    allArticles.sort((a, b) => b.pubDateParsed - a.pubDateParsed);

    // Jika ada pencarian (search), filter judul berita
    let filteredArticles = allArticles;
    if (searchQuery) {
      filteredArticles = allArticles.filter((article) =>
        article.title.toLowerCase().includes(searchQuery),
      );
    }

    const page = parseInt(req.query.page) || 1;
    const perPage = 6;
    const totalPages = Math.ceil(filteredArticles.length / perPage) || 1;

    const startIndex = (page - 1) * perPage;
    const paginatedArticles = filteredArticles.slice(
      startIndex,
      startIndex + perPage,
    );

    res.render("index", {
      articles: paginatedArticles,
      currentPage: page,
      totalPages: totalPages,
      categories: categories,
      currentCategoryKey: catKey,
      searchQuery: searchQuery,
    });
  } catch (error) {
    console.error(error);
    res.send("Gagal memuat berita.");
  }
});
const PORT_NUM = process.env.PORT || 3000;
app.listen(PORT_NUM, () => {
  console.log(`Server berjalan di http://localhost:${PORT_NUM}`);
});
