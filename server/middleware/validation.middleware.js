const Form = require("../models/form.model");
const validateData = require("../utils/validator");

/**
 * Dynamic Validation Middleware
 */
const dynamicValidation = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const form = await Form.findOne({ slug });

    if (!form) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    if (!form.published) {
      return res.status(403).json({ success: false, message: "This API endpoint is not published yet" });
    }

    // Helper to slugify (same as controller)
    const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, "_").replace(/[^\w-]+/g, "").replace(/--+/g, "_");

    // Capture initial data and flatten it if it's section-wise
    const rawData = { ...req.body };
    const data = { ...rawData };

    // If the data is nested by section, flatten it into the main 'data' object for validation
    form.sections?.forEach(section => {
      const sectionKey = `section_${section.title ? slugify(section.title) : section.id}`;
      if (rawData[sectionKey] && typeof rawData[sectionKey] === 'object') {
        Object.assign(data, rawData[sectionKey]);
      }
    });

    const allFields = form.sections && form.sections.length > 0 
      ? form.sections.flatMap(s => s.fields || []) 
      : (form.fields || []);

    // Normalize data: handle multiple selections and JSON stringified values
    allFields.forEach((field) => {
      const { name, multiple, type } = field;
      let value = data[name];

      // 1. Ensure multiple select fields/checkboxes are always arrays (even if one item)
      if ((multiple || type === "checkbox") && value !== undefined) {
        if (!Array.isArray(value)) {
            data[name] = [value];
            value = data[name];
        }
      }

      // 2. Parse JSON strings back to objects (for rich dropdown data)
      if (Array.isArray(value)) {
        data[name] = value.map((v) => {
          if (typeof v === "string" && (v.startsWith("{") || v.startsWith("["))) {
            try { return JSON.parse(v); } catch (e) { return v; }
          }
          return v;
        });
      } else if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        try { data[name] = JSON.parse(value); } catch (e) {}
      }
    });

    if (req.files) {
      req.files.forEach((file) => {
        const url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
        if (data[file.fieldname]) {
          if (!Array.isArray(data[file.fieldname])) {
            data[file.fieldname] = [data[file.fieldname]];
          }
          data[file.fieldname].push(url);
        } else {
          data[file.fieldname] = url;
        }
      });
    }

    const { isValid, errors } = validateData(allFields, data);

    if (!isValid) {
      return res.status(422).json({
        success: false,
        message: "Validation Failed",
        errors,
      });
    }

    // Pass form and validated data to next handler
    req.dynamicForm = form;
    req.validatedData = data;
    next();
  } catch (err) {
    console.error("Validation Middleware Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = dynamicValidation;
