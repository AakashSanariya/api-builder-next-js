import { FormModel } from "../types/form.types";
import { FieldSchema, SectionSchema, FieldType } from "../types/field.types";
import { Relationship, RelationshipType } from "../types/relationship.types";

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");

const fieldTypeToJsonSchema = (
  field: FieldSchema
): Record<string, any> => {
  const schema: Record<string, any> = {};

  switch (field.type) {
    case "input":
    case "textarea":
      schema.type = "string";
      break;
    case "radio":
      schema.type = "string";
      break;
    case "select":
      if (field.multiple) {
        schema.type = "array";
        schema.items = { type: "string" };
      } else {
        schema.type = "string";
      }
      break;
    case "checkbox":
      schema.type = "array";
      schema.items = { type: "string" };
      break;
    case "file":
      schema.type = "string";
      schema.format = "binary";
      break;
    case "button":
      schema.type = "string";
      schema.description = "Button action value";
      break;
    case "link":
      schema.type = "string";
      schema.format = "uri";
      break;
    default:
      schema.type = "string";
  }

  if (field.options && field.options.length > 0) {
    const validValues = field.options
      .map((o) => String(o.value ?? o.id ?? o.label))
      .filter(Boolean);
    if (validValues.length > 0) {
      if (schema.type === "array" && schema.items) {
        schema.items.enum = validValues;
      } else {
        schema.enum = validValues;
      }
    }
  }

  if (field.validations) {
    if (field.validations.minLength) schema.minLength = field.validations.minLength;
    if (field.validations.maxLength) schema.maxLength = field.validations.maxLength;
    if (field.validations.pattern) schema.pattern = field.validations.pattern;
  }

  return schema;
};

const buildSectionSchemas = (
  sections: SectionSchema[],
  fields: FieldSchema[]
) => {
  const schemas: Record<string, any> = {};
  const combinedRequired: string[] = [];

  const targetSections =
    sections.length > 0
      ? sections
      : [{ id: "default", title: "", fields }];

  targetSections.forEach((section) => {
    const sectionSlug = section.title ? slugify(section.title) : section.id;
    const dbKey = `section_${sectionSlug}`;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    section.fields.forEach((field) => {
      if (field.type === "button" || field.type === "link") return;
      properties[field.name] = fieldTypeToJsonSchema(field);
      if (field.validations?.required) {
        required.push(field.name);
        combinedRequired.push(field.name);
      }
    });

    if (Object.keys(properties).length > 0) {
      schemas[dbKey] = {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
      };
    }
  });

  return { schemas, combinedRequired };
};

export const generateOpenApiSpec = (
  form: FormModel,
  relationships?: Relationship[]
): object => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const slug = form.slug;

  const { schemas: sectionSchemas, combinedRequired } = buildSectionSchemas(
    form.sections || [],
    form.fields || []
  );

  const sectionKeys = Object.keys(sectionSchemas);

  const requestBodySchema: Record<string, any> =
    sectionKeys.length === 1
      ? { $ref: `#/components/schemas/${sectionKeys[0]}` }
      : {
          type: "object",
          properties: sectionKeys.reduce<Record<string, any>>(
            (acc, key) => {
              acc[key] = { $ref: `#/components/schemas/${key}` };
              return acc;
            },
            {}
          ),
        };

  const submissionDataSchema: Record<string, any> =
    sectionKeys.length === 1
      ? { $ref: `#/components/schemas/SubmissionData_${slug}` }
      : {
          type: "object",
          properties: sectionKeys.reduce<Record<string, any>>(
            (acc, key) => {
              acc[key] = { $ref: `#/components/schemas/SubmissionData_${slug}` };
              return acc;
            },
            {}
          ),
        };

  const responseDataSchema: Record<string, any> = {
    type: "object",
    properties: {
      _id: { type: "string", description: "Record ID" },
      formSlug: { type: "string" },
      formId: { type: "string" },
      data: requestBodySchema,
      userId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  };

  const spec: Record<string, any> = {
    openapi: "3.0.3",
    info: {
      title: `${form.name} API`,
      version: "1.0.0",
      description: `Auto-generated REST API for \`${form.name}\`.${
        form.published ? "" : " **This schema is in draft mode — endpoints are not active until published.**"
      }`,
    },
    servers: [{ url: baseUrl, description: "API Builder Engine" }],
    security: [{ bearerAuth: [] }],
    paths: {
      [`/api/${slug}`]: {
        post: {
          summary: `Create a new ${form.name} record`,
          operationId: `create${slug.replace(/[-_]/g, "")}`,
          tags: ["Records"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: requestBodySchema,
              },
            },
          },
          responses: {
            "201": {
              description: "Record created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      message: { type: "string" },
                      data: responseDataSchema,
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "422": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      [`/api/${slug}/data`]: {
        get: {
          summary: `List all ${form.name} records`,
          operationId: `list${slug.replace(/[-_]/g, "")}`,
          tags: ["Records"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20, maximum: 100 },
              description: "Records per page",
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of records",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ListResponse" },
                },
              },
            },
          },
        },
      },
      [`/api/${slug}/data/{recordId}`]: {
        get: {
          summary: `Get a single ${form.name} record by ID`,
          operationId: `get${slug.replace(/[-_]/g, "")}`,
          tags: ["Records"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "recordId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Record ID",
            },
          ],
          responses: {
            "200": {
              description: "Record found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: responseDataSchema,
                    },
                  },
                },
              },
            },
            "404": {
              description: "Record not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          summary: `Update an existing ${form.name} record`,
          operationId: `update${slug.replace(/[-_]/g, "")}`,
          tags: ["Records"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "recordId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Record ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: requestBodySchema,
              },
            },
          },
          responses: {
            "200": {
              description: "Record updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      data: responseDataSchema,
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "422": {
              description: "Validation failed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          summary: `Delete a ${form.name} record`,
          operationId: `delete${slug.replace(/[-_]/g, "")}`,
          tags: ["Records"],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "recordId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Record ID",
            },
          ],
          responses: {
            "200": {
              description: "Record deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "404": {
              description: "Record not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from /auth/login",
        },
      },
      schemas: {
        ...sectionSchemas,
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            ...(combinedRequired.length > 0
              ? {
                  errors: {
                    type: "object",
                    description: "Field-level validation errors",
                    example: combinedRequired.reduce<Record<string, string>>(
                      (acc, field) => {
                        acc[field] = `${field} is required`;
                        return acc;
                      },
                      {}
                    ),
                  },
                }
              : {}),
          },
        },
        ListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "array",
              items: responseDataSchema,
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                pages: { type: "integer" },
              },
            },
          },
        },
      },
    },
  };

  if (relationships && relationships.length > 0) {
    const relationshipsPaths: Record<string, any> = {};
    relationshipsPaths[`/api/relations/{relationshipId}/{recordId}`] = {
      get: {
        summary: "Get linked records for a relationship",
        operationId: "getRecordLinks",
        tags: ["Relationships"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "relationshipId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "recordId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Linked records",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          linkId: { type: "string" },
                          recordId: { type: "string" },
                          formId: { type: "string" },
                          data: { type: "object" },
                          direction: {
                            type: "string",
                            enum: ["source", "target"],
                          },
                        },
                      },
                    },
                    relationship: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    };

    relationshipsPaths[`/api/relations/link`] = {
      post: {
        summary: "Link two records",
        operationId: "linkRecords",
        tags: ["Relationships"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "sourceFormId",
                  "sourceRecordId",
                  "targetFormId",
                  "targetRecordId",
                  "relationshipId",
                ],
                properties: {
                  sourceFormId: { type: "string" },
                  sourceRecordId: { type: "string" },
                  targetFormId: { type: "string" },
                  targetRecordId: { type: "string" },
                  relationshipId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Records linked successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
        },
      },
    };

    spec.paths = { ...spec.paths, ...relationshipsPaths };
  }

  return spec;
};

export const downloadOpenApiSpec = (form: FormModel, relationships?: Relationship[]) => {
  const spec = generateOpenApiSpec(form, relationships);
  const json = JSON.stringify(spec, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${form.slug}.openapi.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
