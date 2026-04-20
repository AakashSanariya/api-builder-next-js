const mongoose = require("mongoose");
const Form = require("../models/form.model");

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
    },
    { timestamps: true, strict: false, collection: collectionName }
  );

  return mongoose.model(modelName, DynamicDataSchema);
};

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
    const DynamicData = getDynamicDataModel(dynamicForm.slug);

    const savedRecord = await DynamicData.create({
      formSlug: dynamicForm.slug,
      formId: dynamicForm._id,
      data: validatedData,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: `Successfully processed submission for '${dynamicForm.name}'`,
      data: savedRecord,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/:slug/data/:recordId (Fetch one submitted record for prefill/edit)
exports.listDynamicSubmissions = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const [rows, total] = await Promise.all([
      DynamicData.find({ formSlug: slug }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DynamicData.countDocuments({ formSlug: slug }),
    ]);

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/:slug/data/:recordId (Fetch one submitted record for prefill/edit)
exports.getDynamicSubmission = async (req, res) => {
  try {
    const { slug, recordId } = req.params;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const record = await DynamicData.findById(recordId).lean();

    if (!record) {
      return res.status(404).json({ success: false, message: "Submitted data not found" });
    }

    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/:slug/data/:recordId (Update prefilled submitted record)
exports.updateDynamicSubmission = async (req, res) => {
  try {
    const { slug, recordId } = req.params;
    const { dynamicForm, validatedData } = req;
    const DynamicData = getDynamicDataModel(slug);

    const updatedRecord = await DynamicData.findOneAndUpdate(
      { _id: recordId, formSlug: dynamicForm.slug, formId: dynamicForm._id },
      {
        data: validatedData,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: "Submitted data not found" });
    }

    res.json({
      success: true,
      message: `Successfully updated submission for '${dynamicForm.name}'`,
      data: updatedRecord,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
