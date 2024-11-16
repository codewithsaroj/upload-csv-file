import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { uploadBulkUser } from "../controllers/userController.js";

export const userRouter = express.Router();
// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url); // Convert the module URL to a file path
const __dirname = path.dirname(__filename); // Get the directory name

// Define the path to the 'upload' directory
const uploadDir = path.join(process.cwd(), "upload");

// Ensure the 'upload' directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

userRouter.post("/upload", upload.single("csvFile"), uploadBulkUser);
