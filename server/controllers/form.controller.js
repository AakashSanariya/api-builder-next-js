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
    const { fields, sections, published } = req.body;
    const updateData = { published: published ?? false };
    
    if (sections) updateData.sections = sections;
    if (fields) updateData.fields = fields;

    const form = await Form.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!form) return res.status(404).json({ success: false, message: "Form not found" });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")      // Replace spaces with _
    .replace(/[^\w-]+/g, "")   // Remove all non-word chars
    .replace(/--+/g, "_");     // Replace multiple - or _ with single _
};

const groupDataBySection = (sections, validatedData) => {
  if (!sections || sections.length === 0) return validatedData;
  
  const grouped = {};
  sections.forEach(section => {
    const sectionData = {};
    section.fields.forEach(field => {
      if (validatedData[field.name] !== undefined) {
        sectionData[field.name] = validatedData[field.name];
      }
    });
    
    // Create DYNAMIC_USER_ADDED_NAME slug
    const sectionSlug = section.title ? slugify(section.title) : section.id;
    const dbKey = `section_${sectionSlug}`;
    
    grouped[dbKey] = sectionData;
  });
  return grouped;
};

// POST /api/forms/:slug (Dynamic API Core)
exports.handleDynamicSubmission = async (req, res) => {
  try {
    const { dynamicForm, validatedData } = req;
    const DynamicData = getDynamicDataModel(dynamicForm.slug);
    
    // Grouping data by section before storage if sections exist
    const structuredData = groupDataBySection(dynamicForm.sections, validatedData);

    const savedRecord = await DynamicData.create({
      formSlug: dynamicForm.slug,
      formId: dynamicForm._id,
      data: structuredData,
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
    
    // Grouping data by section before storage if sections exist
    const structuredData = groupDataBySection(dynamicForm.sections, validatedData);

    const updatedRecord = await DynamicData.findOneAndUpdate(
      { _id: recordId, formSlug: dynamicForm.slug, formId: dynamicForm._id },
      {
        data: structuredData,
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

// DELETE /api/:slug/data/:recordId (Delete a submitted record)
exports.deleteDynamicSubmission = async (req, res) => {
  try {
    const { slug, recordId } = req.params;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const DynamicData = getDynamicDataModel(slug);
    const deletedRecord = await DynamicData.findOneAndDelete({
      _id: recordId,
      formSlug: slug,
    });

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: "Submitted data not found" });
    }

    res.json({
      success: true,
      message: `Successfully deleted submission for '${form.name}'`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// DELETE /forms/:id (Delete entire Form Schema + all its dynamic data)
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    // Identify the precise collection name (MUST MATCH getDynamicDataModel)
    const safeSlug = form.slug.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const collectionName = `${safeSlug}_data`;
    const modelName = `${safeSlug}_data`;
    // 1. Drop the actual MongoDB collection directly via native driver
    const db = mongoose.connection.db;
    if (db) {
      try {
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length > 0) {
          await db.dropCollection(collectionName);
          console.log(`Successfully dropped collection: ${collectionName}`);
        }
      } catch (dropErr) {
        console.warn(`Could not drop collection ${collectionName}:`, dropErr.message);
      }
    }

    // 2. Clear out the cached model from Mongoose to prevent re-instantiation errors
    if (mongoose.models[modelName]) {
      mongoose.deleteModel(modelName);
    }

    // 3. Delete the form schema record
    await Form.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `System Entity '${form.name}' neutralized. All modular blocks and associated traffic collections have been purged.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
