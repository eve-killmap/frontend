import { AvailableAttribute } from "@/components/filter/filter-builder";

export const FILTER_ATTRIBUTES: AvailableAttribute[] = [
  {
    attribute: "character",
    label: "Character",
    picker: "entity",
    sides: ["victim", "attacker", "involved"],
  },
  {
    attribute: "corporation",
    label: "Corporation",
    picker: "entity",
    sides: ["victim", "attacker", "involved"],
  },
  {
    attribute: "alliance",
    label: "Alliance",
    picker: "entity",
    sides: ["victim", "attacker", "involved"],
  },
  {
    attribute: "faction",
    label: "Faction",
    picker: "entity",
    sides: ["victim", "attacker", "involved"],
  },
  {
    attribute: "ship",
    label: "Ship",
    picker: "ship",
    sides: ["victim", "attacker", "involved"],
  },
  { attribute: "weapon", label: "Weapon", picker: "weapon" },
  { attribute: "war", label: "Part of a war", picker: "war" },
];
