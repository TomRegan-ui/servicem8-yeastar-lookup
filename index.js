import express from "express";
import fetch from "node-fetch";

const app = express();

// ✅ Render port
const PORT = process.env.PORT;

// ✅ ServiceM8 API key
const API_KEY = process.env.SERVICEM8_API_KEY;


// ✅ Root route
app.get("/", (req, res) => {
  res.status(200).send("OK");
});


// ✅ Test route
app.get("/test", (req, res) => {
  res.send("TEST ROUTE WORKING");
});


// ✅ Main lookup route
app.get("/lookup", async (req, res) => {
  try {
    let number = req.query.number;

    console.log("----- NEW REQUEST -----");
    console.log("Incoming number:", number);
    console.log("API KEY PRESENT:", !!API_KEY);

    if (!number) {
      return res.status(400).json({ error: "Missing number parameter" });
    }

    // ✅ Clean number (strip spaces, +, etc.)
    number = number.replace(/\D/g, "");

    console.log("Normalized number:", number);

    // ✅ Call ServiceM8 search (same as your REST client)
    const response = await fetch(
      `https://api.servicem8.com/api_1.0/search.json?query=${number}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      }
    );

    console.log("ServiceM8 status:", response.status);

    const data = await response.json();

    console.log("RAW RESPONSE:", JSON.stringify(data, null, 2));

    // ✅ Handle BOTH possible response formats
    let results = [];

    if (Array.isArray(data)) {
      results = data;
    } else if (data && Array.isArray(data.results)) {
      results = data.results;
    }

    console.log("Parsed results count:", results.length);

    // ✅ Find a contact
    const contact = results.find(item => item.type === "companycontact");

    if (contact) {
      const name = `${contact.first || ""} ${contact.last || ""}`.trim();

      console.log("✅ Match found:", name);

      return res.json({
        name: name || "Unknown",
        phone: contact.mobile || contact.phone || ""
      });
    }

    console.log("❌ No match found");

    return res.json({ name: "Unknown Caller" });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});


// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
