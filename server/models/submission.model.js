const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    formSlug: { type: String, required: true, index: true },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", SubmissionSchema);
