const Form = require("../models/form.model");

// GET /forms
exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    res.json({ success: true, data: forms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /forms/:id (or slug)
exports.getFormById = async (req, res) => {
  try {
    const { id } = req.params;
    let form;
    
    // Attempt to find by ID first, then by slug
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      form = await Form.findById(id);
    }
    
    if (!form) {
      form = await Form.findOne({ slug: id });
    }

    if (!form) return res.status(404).json({ success: false, message: "Form not found" });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /forms
exports.createForm = async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    
    // Check if slug already exists
    const existing = await Form.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: "Form name already taken" });

    const newForm = new Form({ 
      name, 
      slug,
      fields: [],
      published: false 
    });
    
    await newForm.save();
    res.status(201).json({ success: true, data: newForm });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /forms/:id (Update Schema)
exports.updateFormSchema = async (req, res) => {
  try {
    const { fields, published } = req.body;
    const form = await Form.findByIdAndUpdate(
      req.params.id,
      { fields, published: published ?? false },
      { new: true }
    );
    
    if (!form) return res.status(404).json({ success: false, message: "Form not found" });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/forms/:slug (Dynamic API Core)
exports.handleDynamicSubmission = async (req, res) => {
  try {
    const { dynamicForm, validatedData } = req;
    
    // Logic to store submissions could be added here
    // For now, return a successful response with the data
    res.json({
      success: true,
      message: `Successfully processed submission for '${dynamicForm.name}'`,
      data: validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
