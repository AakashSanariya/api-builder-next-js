const express = require("express");
const router = express.Router();
const FormSchema = require("../models/Schema");

// GET all schemas or filter by name
router.get("/", async (req, res) => {
  try {
    const { name } = req.query;
    const query = name ? { name } : {};
    const schemas = await FormSchema.find(query).sort({ createdAt: -1 });
    res.json(schemas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET specific schema
router.get("/:id", async (req, res) => {
  try {
    const schema = await FormSchema.findById(req.params.id);
    if (!schema) return res.status(404).json({ message: "Schema not found" });
    res.json(schema);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new schema
router.post("/", async (req, res) => {
  const schema = new FormSchema({
    name: req.body.name,
    fields: req.body.fields,
  });

  try {
    const newSchema = await schema.save();
    res.status(201).json(newSchema);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update schema
router.put("/:id", async (req, res) => {
  try {
    const updatedSchema = await FormSchema.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        fields: req.body.fields,
      },
      { new: true }
    );
    if (!updatedSchema) return res.status(404).json({ message: "Schema not found" });
    res.json(updatedSchema);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE schema
router.delete("/:id", async (req, res) => {
  try {
    const schema = await FormSchema.findByIdAndDelete(req.params.id);
    if (!schema) return res.status(404).json({ message: "Schema not found" });
    res.json({ message: "Schema deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
