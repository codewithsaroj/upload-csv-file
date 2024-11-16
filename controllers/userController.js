import csvParser from "csv-parser";
import fs from "fs";
import User from "../model/userModel.js";

export const uploadBulkUser = async (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).send("No file uploaded");
  }
  let users = [];
  const existingUsers = [];
  const insertedUsers = [];
  try {
    const parseCSV = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => {
          const user = {
            name: row.Name,
            email: row.Email,
            phone: row.Phone,
          };
          users.push(user);
        })
        .on("end", () => resolve(users))
        .on("error", (err) => {
          console.error("Error during CSV parsing:", err);
          reject(err);
        });
    });

    users = await parseCSV;
    const uniqueUsers = [];
    const set = new Set();
    users.forEach((user) => {
      const key = `${user.email}-${user.phone}`;
      if (!set.has(key)) {
        uniqueUsers.push(user);
        set.add(key);
      }
    });

    if (uniqueUsers.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid data found in the CSV file" });
    }

    for (const item of uniqueUsers) {
      try {
        const isUserExists = await User.findOne({
          $or: [{ email: item.email }, { phone: item.phone }],
        });

        if (isUserExists) {
          existingUsers.push(item);
        } else {
          insertedUsers.push(item);
        }
      } catch (userError) {
        console.error("Error checking user existence:", userError);
        return res.status(500).json({
          error: `Error checking user existence for ${item.email}: ${userError.message}`,
        });
      }
    }

    let newUsers = [];
    if (insertedUsers.length > 0) {
      try {
        newUsers = await User.insertMany(insertedUsers, { ordered: false });
        return res.status(200).json({
          existingUsers: existingUsers,
          newUsers: newUsers,
        });
      } catch (insertError) {
        if (insertError.code === 11000) {
          console.warn("Duplicate user found during insert, skipping...");
        } else {
          console.error(
            "Error inserting users into the database:",
            insertError
          );
          return res.status(500).json({
            error: `Error inserting users into database: ${insertError.message}`,
          });
        }
      }
    }

    return res.status(200).json({
      message: `${newUsers.length} new users uploaded successfully, ${existingUsers.length} existing users skipped.`,
      newUsers,
      existingUsers,
    });
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred while processing the file: ${error.message}`,
    });
  } finally {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error("Error deleting uploaded file:", fileError);
    }
  }
};
