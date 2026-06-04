import express from "express";
import fetch from "node-fetch";

const app = express();

// ✅ Use ONLY Render's assigned port
const PORT = process.env.PORT;

// ✅ Your ServiceM8 API key from Render environment variables
const API_KEY = process.env.SERVICEM8_API_KEY;


// ✅ Root test route
app.get("/", (req, res) => {
  res.status(200).send("OK");
});


// ✅ Debug test route
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

    // ✅ Clean + normalise number
    number = number.replace(/\D/g, "");

    if (number.startsWith("0")) {
      number = "44" + number.slice(1);
    }

    console.log("Normalized number:", number);

    // ✅ Call ServiceM8 API
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

    console.log("ServiceM8 raw response:", data);

    // ✅ Ensure response is an array
    if (!Array.isArray(data)) {
      console.error("Unexpected response format:", data);
      return res.json({ name: "Lookup failed" });
    }

    // ✅ Find matching contact
    const contact = data.find(
      (item) => item.type === "companycontact"
    );

    if (contact) {
      const name = `${contact.first || ""} ${contact.last || ""}`.trim();

      console.log("Match found:", name);

      return res.json({
        name: name || "Unknown",
        phone: contact.mobile || contact.phone || ""
      });
    }

    console.log("No match found");

    return res.json({ name: "Unknown Caller" });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});


// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
