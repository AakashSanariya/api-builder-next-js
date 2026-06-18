const mongoose = require("mongoose");

const RelationLinkSchema = new mongoose.Schema(
  {
    sourceFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    sourceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetFormId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    targetRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    relationshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Relationship",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

RelationLinkSchema.index({ sourceFormId: 1, sourceRecordId: 1 });
RelationLinkSchema.index({ targetFormId: 1, targetRecordId: 1 });
RelationLinkSchema.index({ relationshipId: 1 });
RelationLinkSchema.index({ userId: 1 });

module.exports = mongoose.model("RelationLink", RelationLinkSchema);
