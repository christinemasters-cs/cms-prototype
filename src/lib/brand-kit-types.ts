export type BrandKitGoalPriority = "High" | "Medium" | "Low";

export type BrandKitCadence = "Weekly" | "Monthly" | "Quarterly" | "Annually";

export type BrandKitGoal = {
  id: string;
  text: string;
  priority: BrandKitGoalPriority;
};

export type BrandKitKpi = {
  id: string;
  name: string;
  target: string;
  unit: string;
  cadence: BrandKitCadence;
};

export type BrandKitItem = {
  id: string;
  name: string;
  mission: string;
  goals: BrandKitGoal[];
  websiteKpis: BrandKitKpi[];
  members: number;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandKitInput = {
  name: string;
  mission: string;
  goals: BrandKitGoal[];
  websiteKpis: BrandKitKpi[];
  members?: number;
  starred?: boolean;
};
