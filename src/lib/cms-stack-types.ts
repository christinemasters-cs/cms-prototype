export type CmsStackEnvironment = "Production" | "Staging" | "Development";

export type CmsStackRegion = "US" | "EU" | "APAC";

export type CmsStackItem = {
  id: string;
  name: string;
  description: string;
  region: CmsStackRegion;
  environment: CmsStackEnvironment;
  members: number;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CmsStackInput = {
  name: string;
  description: string;
  region: CmsStackRegion;
  environment: CmsStackEnvironment;
  members?: number;
  starred?: boolean;
};
