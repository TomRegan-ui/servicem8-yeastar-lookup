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

    // ✅ Clean number
    number = number.replace(/\D/g, "");
    console.log("Normalized number:", number);

    // ✅ Call ServiceM8 search API
    const response = await fetch(
      `https://api.servicem8.com/api_1.0/search.json?query=${number}`,
      {
        headers: {
          "X-API-Key": API_KEY
        }
      }
    );

    console.log("ServiceM8 status:", response.status);

    const data = await response.json();

    console.log("RAW RESPONSE:", JSON.stringify(data, null, 2));

    // ✅ Extract results safely
    let results = [];

    if (Array.isArray(data)) {
      results = data;
    } else if (data && Array.isArray(data.results)) {
      results = data.results;
    }

    console.log("Parsed results count:", results.length);
    console.log("Result types:", results.map(r => r.type));

    // ✅ Prefer COMPANY first (best match for your data)
    const contact =
      results.find(r => r.type === "company") ||
      results.find(r => r.type === "companycontact") ||
      results.find(r => r.type === "contact");

    if (contact) {
      console.log("Matched type:", contact.type);

      // ✅ COMPANY (your real case)
      if (contact.type === "company" && contact.data) {
        const name = contact.data.name || "Unknown";

        // ✅ Extract phone from highlights (clean HTML)
        const phoneRaw = contact.highlights?.phone_numbers || "";
        const phoneClean = phoneRaw.replace(/<[^>]+>/g, "");

        return res.json({
          name: name,
          phone: phoneClean
        });
      }

      // ✅ CONTACTS (if returned instead)
      if (contact.type === "companycontact" && contact.data) {
        const name = `${contact.data.first || ""} ${contact.data.last || ""}`.trim();

        return res.json({
          name: name || "Unknown",
          phone: contact.data.mobile || contact.data.phone || ""
        });
      }

      if (contact.type === "contact" && contact.data) {
        const name = contact.data.name || "Unknown";

        return res.json({
          name: name,
          phone: contact.data.mobile || contact.data.phone || ""
        });
      }
    }

    console.log("❌ No usable match");

    return res.json({
      name: "Unknown Caller",
      phone: ""
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});


// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

