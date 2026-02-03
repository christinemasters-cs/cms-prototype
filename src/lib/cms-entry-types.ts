export type CmsEntryStatus = "draft" | "staging" | "production";

export type CmsEntryItem = {
  id: string;
  title: string;
  language: string;
  contentType: string;
  variants: string;
  version: number;
  status: CmsEntryStatus[];
  updatedAt: string;
  fields: {
    singleLine: string;
    multiLine: string;
    richText: string;
    jsonRichText: string;
  };
};

export type CmsEntryInput = {
  title: string;
  language: string;
  contentType: string;
  variants: string;
  version: number;
  status: CmsEntryStatus[];
  fields: {
    singleLine: string;
    multiLine: string;
    richText: string;
    jsonRichText: string;
  };
};
