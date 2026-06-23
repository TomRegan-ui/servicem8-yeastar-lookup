import express from "express";
import fetch from "node-fetch";

const app = express();

// ✅ Use Render port
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

    // ✅ Build UK variants
    const variants = new Set();

    variants.add(number);

    if (number.startsWith("0")) {
      variants.add("44" + number.slice(1));
    }

    if (number.startsWith("44")) {
      variants.add("0" + number.slice(2));
    }

    console.log("Number variants:", [...variants]);

    let foundContact = null;

    // ✅ Try each variant against ServiceM8
    for (const num of variants) {
      console.log("Trying:", num);

      const urls = [
        `companycontact.json?mobile=${num}`,
        `companycontact.json?phone=${num}`
      ];

      for (const path of urls) {
        const response = await fetch(
          `https://api.servicem8.com/api_1.0/${path}`,
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`
            }
          }
        );

        console.log("URL:", path, "Status:", response.status);

        const data = await response.json();

        console.log("Response:", data);

        if (Array.isArray(data) && data.length > 0) {
          foundContact = data[0];
          break;
        }
      }

      if (foundContact) break;
    }

    // ✅ If match found
    if (foundContact) {
      const name = `${foundContact.first || ""} ${foundContact.last || ""}`.trim();

      console.log("✅ Match found:", name);

      return res.json({
        name: name || "Unknown",
        phone: foundContact.mobile || foundContact.phone || ""
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

