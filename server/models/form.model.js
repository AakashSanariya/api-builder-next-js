const mongoose = require("mongoose");

const FieldSchema = new mongoose.Schema({
  id: String,
  type: {
    type: String,
    enum: ["input", "radio", "checkbox", "select", "textarea", "file", "button", "link"],
    required: true,
  },
  label: String,
  name: { type: String, required: true },
  validations: {
    required: Boolean,
    minLength: Number,
    maxLength: Number,
    pattern: String,
  },
  options: [
    {
      label: String,
      value: mongoose.Schema.Types.Mixed,
      id: String,
    },
  ],
  multiple: Boolean,
  url: String,
  target: String,
  value: String,
});

const FormSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    fields: [FieldSchema],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Form", FormSchema);
