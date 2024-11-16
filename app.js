import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import multer from "multer";
import { userRouter } from "./routes/userRouter.js";
import { dbConnection } from "./db/db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to server");
});

app.use("/api/user", userRouter);

const PORT = process.env.PORT || 8080;

dbConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("error while connecting");
  });
