const mongoose = require("mongoose");

// Shared factory for per-slug dynamic record collections ({slug}_data).
// Used by form/submission endpoints, exports and analytics aggregation.
const getDynamicDataModel = (slug) => {
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  const modelName = `${safeSlug}_data_model`;
  const collectionName = `${safeSlug}_data`;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  const DynamicDataSchema = new mongoose.Schema(
    {
      formSlug: { type: String, required: true, index: true },
      formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      ip: { type: String },
      userAgent: { type: String },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true, strict: false, collection: collectionName }
  );

  return mongoose.model(modelName, DynamicDataSchema);
};

module.exports = getDynamicDataModel;
