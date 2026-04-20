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

    // Capture file URLs from multer if present
    const data = { ...req.body };
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

    const { isValid, errors } = validateData(form.fields, data);

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
