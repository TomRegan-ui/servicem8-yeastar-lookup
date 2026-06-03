
import express from "express";
import fetch from "node-fetch";

const app = express();

// ✅ FORCE Render port usage ONLY
const PORT = process.env.PORT;

const API_KEY = process.env.SERVICEM8_API_KEY;

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.get("/lookup", async (req, res) => {
  try {
    let number = req.query.number;

    if (!number) {
      return res.status(400).json({ error: "Missing number parameter" });
    }

    number = number.replace(/\D/g, "");

    if (number.startsWith("0")) {
      number = "44" + number.slice(1);
    }

    const response = await fetch(
      `https://api.servicem8.com/api_1.0/search.json?query=${number}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`
        }
      }
    );

    const data = await response.json();

    const contact = data.find(item => item.type === "companycontact");

    if (contact) {
      return res.json({
        name: `${contact.first} ${contact.last}`,
        phone: contact.mobile || contact.phone || ""
      });
    }

    return res.json({ name: "Unknown Caller" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
