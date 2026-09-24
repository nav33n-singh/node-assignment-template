require("dotenv").config();

const express = require("express");
const db = require("./db/sequelize");

(async () => {
  const app = express();

  app.use(express.json());

  await db.testConnection();
  const { bid: bidController } = require("./controllers/bid");
  app.post("/bid", bidController);

  app.use((err, req, res, next) => {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  });

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
