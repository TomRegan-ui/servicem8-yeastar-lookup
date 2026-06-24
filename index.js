import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ✅ Use Render assigned port ONLY
const PORT = process.env.PORT;

// ✅ API key from Render environment variables
const API_KEY = process.env.SERVICEM8_API_KEY;


// ✅ Root route
app.get("/", (req, res) => {
  res.status(200).send("OK");
});


// ✅ Test route
app.get("/test", (req, res) => {
  res.send("TEST ROUTE WORKING");
});


// ✅ Lookup route (used by Yeastar)
app.get("/lookup", async (req, res) => {
  try {
    let number = req.query.number;

    console.log("----- LOOKUP REQUEST -----");
    console.log("Incoming number:", number);

    if (!number) {
      return res.status(400).json({ error: "Missing number parameter" });
    }

    // ✅ Clean number
    number = number.replace(/\D/g, "");

    if (number.startsWith("0")) {
      number = "44" + number.slice(1);
    }

    console.log("Normalized number:", number);

    // ✅ Search ServiceM8
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
    console.log("ServiceM8 response:", data);

    if (Array.isArray(data)) {
      const contact = data.find(
        (item) => item.type === "companycontact"
      );

      // ✅ FOUND CONTACT
      if (contact) {
        const name = `${contact.first || ""} ${contact.last || ""}`.trim();

        return res.json({
          name: name || "Unknown",
          phone: contact.mobile || contact.phone || "",
          company_uuid: contact.company_uuid
        });
      }
    }

    console.log("No match found — creating new contact");

    // ✅ CREATE NEW COMPANY
    const createResponse = await fetch(
      "https://api.servicem8.com/api_1.0/company.json",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `Caller ${number}`,
          phone: number,
          note: "Auto-created from Yeastar"
        })
      }
    );

    const newCompany = await createResponse.json();

    console.log("Created company:", newCompany);

    return res.json({
      name: "New Caller",
      phone: number,
      company_uuid: newCompany.uuid
    });

  } catch (error) {
    console.error("LOOKUP ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});


// ✅ Create contact route (Yeastar POST integration)
app.post("/create-contact", async (req, res) => {
  try {
    console.log("----- CREATE CONTACT REQUEST -----");
    console.log("Request body:", req.body);

    let number = req.body.phone || req.body.mobile || "";

    // ✅ Clean number
    number = number.replace(/\D/g, "");

    if (number.startsWith("0")) {
      number = "44" + number.slice(1);
    }

    const name = req.body.name || `Caller ${number}`;

    // ✅ Create in ServiceM8
    const createResponse = await fetch(
      "https://api.servicem8.com/api_1.0/company.json",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          phone: number,
          note: "Created from Yeastar contact sync"
        })
      }
    );

    const data = await createResponse.json();

    console.log("Created in ServiceM8:", data);

    return res.json({
      success: true,
      company_uuid: data.uuid
    });

  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create contact"
    });
  }
});


// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
