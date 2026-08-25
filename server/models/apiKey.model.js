const mongoose = require("mongoose");
const crypto = require("crypto");

const ApiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ApiKeySchema.statics.generateKey = function () {
  return "ak_" + crypto.randomBytes(24).toString("hex");
};

ApiKeySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.key;
  obj.keyPreview = this.key.slice(0, 12) + "...";
  return obj;
};

module.exports = mongoose.model("ApiKey", ApiKeySchema);
