const typeDefs = `#graphql
  scalar JSON
  scalar Upload

  type Form {
    _id: ID!
    name: String!
    slug: String!
    fields: [Field!]
    sections: [Section!]
    published: Boolean!
    userId: ID!
    createdAt: String
    updatedAt: String
  }

  type Field {
    id: String
    type: String!
    label: String
    name: String!
    validations: FieldValidation
    options: [FieldOption!]
    multiple: Boolean
    url: String
    target: String
    value: String
  }

  type FieldValidation {
    required: Boolean
    minLength: Int
    maxLength: Int
    pattern: String
  }

  type FieldOption {
    label: String
    value: String
    id: String
  }

  type Section {
    id: String
    title: String
    fields: [Field!]
  }

  input FieldInput {
    id: String!
    type: String!
    label: String!
    name: String!
    validations: FieldValidationInput
    options: [FieldOptionInput!]
    multiple: Boolean
    url: String
    target: String
    value: String
  }

  input FieldValidationInput {
    required: Boolean
    minLength: Int
    maxLength: Int
    pattern: String
  }

  input FieldOptionInput {
    label: String!
    value: String!
    id: String
  }

  input SectionInput {
    id: String!
    title: String!
    fields: [FieldInput!]!
  }

  type DynamicRecord {
    _id: ID!
    formSlug: String!
    formId: ID!
    data: JSON!
    ip: String
    userAgent: String
    userId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }

  type SubmissionList {
    records: [DynamicRecord!]!
    pagination: Pagination!
  }

  type SubmissionPayload {
    success: Boolean!
    message: String!
    data: DynamicRecord!
    timestamp: String
  }

  type DeletePayload {
    success: Boolean!
    message: String!
  }

  type AuthPayload {
    success: Boolean!
    message: String
    token: String
    data: UserProfile
  }

  type UserProfile {
    firstName: String
    lastName: String
    email: String
  }

  type Query {
    me: UserProfile!
    forms: [Form!]!
    form(id: ID!): Form
    submissions(slug: String!, page: Int, limit: Int): SubmissionList!
    submission(slug: String!, recordId: ID!): DynamicRecord
  }

  type Mutation {
    signup(firstName: String!, lastName: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createForm(name: String!): Form!
    updateFormSchema(id: ID!, sections: [SectionInput!], published: Boolean): Form!
    deleteForm(id: ID!): DeletePayload!
    createSubmission(slug: String!, data: JSON, files: [Upload!]): SubmissionPayload!
    updateSubmission(slug: String!, recordId: ID!, data: JSON, files: [Upload!]): SubmissionPayload!
    deleteSubmission(slug: String!, recordId: ID!): DeletePayload!
  }
`;

module.exports = typeDefs;
