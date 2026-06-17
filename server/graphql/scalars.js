const { GraphQLScalarType, Kind } = require("graphql");

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return parseObject(ast);
    }
    if (ast.kind === Kind.LIST) {
      return ast.values.map((v) => parseLiteralNode(v));
    }
    return parseLiteralNode(ast);
  },
});

function parseLiteralNode(ast) {
  switch (ast.kind) {
    case Kind.STRING:
      return ast.value;
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return ast.value;
    case Kind.OBJECT:
      return parseObject(ast);
    case Kind.LIST:
      return ast.values.map((v) => parseLiteralNode(v));
    case Kind.NULL:
      return null;
    default:
      return null;
  }
}

function parseObject(ast) {
  const obj = {};
  for (const field of ast.fields) {
    obj[field.name.value] = parseLiteralNode(field.value);
  }
  return obj;
}

module.exports = { JSONScalar };
