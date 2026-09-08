const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "MongoDB URI is missing. Set MONGODB_URI or MONGO_URI in backend/.env.",
    );
  }

  try {
    await mongoose.connect(mongoUri);

    const leadIndexes = await mongoose.connection.collection("leads").indexes();
    if (leadIndexes.some((index) => index.name === "company_1")) {
      await mongoose.connection.collection("leads").dropIndex("company_1");
      console.log("Removed obsolete leads company index");
    }

    console.log("MongoDB connected");
  } catch (error) {
    if (error.code === 26 || error.code === 27) {
      console.log("MongoDB connected");
      return;
    }
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
module.exports = connectDB;
