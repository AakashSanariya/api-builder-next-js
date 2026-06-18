const mongoose = require("mongoose");

const RelationshipSchema = new mongoose.Schema(
  {
    sourceFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },
    targetFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["one-to-one", "one-to-many", "many-to-many"],
      required: true,
    },
    sourceLabel: { type: String, default: "" },
    targetLabel: { type: String, default: "" },
    eagerLoad: { type: Boolean, default: false },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

RelationshipSchema.index({ sourceFormId: 1, targetFormId: 1 }, { unique: false });
RelationshipSchema.index({ userId: 1 });

module.exports = mongoose.model("Relationship", RelationshipSchema);
