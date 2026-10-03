export type FilterAttribute =
  | "character"
  | "corporation"
  | "alliance"
  | "faction"
  | "ship"
  | "weapon"
  | "war";

export type FilterSide = "victim" | "attacker" | "involved";

export interface FilterValue {
  id: number;
  name: string;
  image_url?: string;
  ticker?: string | null;
  detail?: string;
}

export interface FilterCondition {
  uid: string;
  attribute: FilterAttribute;
  side?: FilterSide;
  values: FilterValue[];
  warAny?: boolean;
}

export type Filter = FilterCondition[];
