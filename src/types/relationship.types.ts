export type RelationshipType = "one-to-one" | "one-to-many" | "many-to-many";

export interface RelationLink {
  _id: string;
  sourceFormId: string;
  sourceRecordId: string;
  targetFormId: string;
  targetRecordId: string;
  relationshipId: string;
  userId: string;
  createdAt: string;
}

export interface LinkedRecord {
  linkId: string;
  recordId: string;
  formId: string;
  data: Record<string, any>;
  direction: "source" | "target";
  createdAt: string;
}

export interface LinkRecordsDTO {
  sourceFormId: string;
  sourceRecordId: string;
  targetFormId: string;
  targetRecordId: string;
  relationshipId: string;
}

export interface UnlinkRecordsDTO {
  relationshipId: string;
  sourceRecordId: string;
  targetRecordId: string;
}

export interface Relationship {
  _id: string;
  sourceFormId: string;
  targetFormId: string;
  type: RelationshipType;
  sourceLabel: string;
  targetLabel: string;
  eagerLoad: boolean;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  sourceForm?: { _id: string; name: string; slug: string };
  targetForm?: { _id: string; name: string; slug: string };
}

export interface CreateRelationshipDTO {
  sourceFormId: string;
  targetFormId: string;
  type: RelationshipType;
  sourceLabel?: string;
  targetLabel?: string;
  eagerLoad?: boolean;
}

export interface UpdateRelationshipDTO {
  type?: RelationshipType;
  eagerLoad?: boolean;
  sourceLabel?: string;
  targetLabel?: string;
}
