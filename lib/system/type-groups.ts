import { TypeData } from "@/lib/schema/system-schema";

export interface TypeEntry {
  typeId: number;
  typeName: string;
}

export interface GroupEntry {
  groupId: number;
  groupName: string;
  types: TypeEntry[];
}

export function buildTypeGroups(
  typeData: TypeData,
  presentTypes: Set<number> | null,
): { groups: GroupEntry[]; allTypeIds: number[] } {
  const { groupNames, typeNames, typeTree } = typeData;
  const groups: GroupEntry[] = [];
  const allTypeIds: number[] = [];

  for (const [gidStr, typeIds] of Object.entries(typeTree)) {
    const gid = Number(gidStr);
    const gName = groupNames[gidStr] ?? `Group ${gid}`;
    const types = typeIds
      .filter((tid) => !presentTypes || presentTypes.has(tid))
      .map((tid) => ({
        typeId: tid,
        typeName: typeNames[String(tid)] ?? `Type ${tid}`,
      }))
      .sort((a, b) => a.typeName.localeCompare(b.typeName));

    for (const t of types) allTypeIds.push(t.typeId);
    if (types.length > 0) {
      groups.push({ groupId: gid, groupName: gName, types });
    }
  }

  groups.sort((a, b) => a.groupName.localeCompare(b.groupName));
  return { groups, allTypeIds };
}

export function filterGroups(
  groups: GroupEntry[],
  query: string,
): GroupEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => {
      if (group.groupName.toLowerCase().includes(q)) return group;
      const matchingTypes = group.types.filter(
        (t) =>
          t.typeName.toLowerCase().includes(q) || String(t.typeId).includes(q),
      );
      if (matchingTypes.length === 0) return null;
      return { ...group, types: matchingTypes };
    })
    .filter((g): g is GroupEntry => g !== null);
}
