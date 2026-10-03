export function locationZkillUrl(id: number): string {
  return `https://zkillboard.com/location/${id}/`;
}

export function killmailZkillUrl(id: number): string {
  return `https://zkillboard.com/kill/${id}`;
}

export function getEntityInfo(ids: EntityIds, size = 64) {
  const { characterId, corporationId, allianceId, factionId, shipTypeId } = ids;

  if (characterId) {
    return {
      zkillUrl: characterZkillUrl(characterId),
      portraitUrl: characterPortraitUrl(characterId, size),
    };
  }

  if (corporationId) {
    return {
      zkillUrl: corporationZkillUrl(corporationId),
      portraitUrl: corporationLogoUrl(corporationId, size),
    };
  }

  if (allianceId) {
    return {
      zkillUrl: allianceZkillUrl(allianceId),
      portraitUrl: allianceLogoUrl(allianceId, size),
    };
  }

  if (factionId) {
    if (factionId === 500021) {
      if (shipTypeId) {
        return {
          zkillUrl: typeZkillUrl(shipTypeId),
          portraitUrl: corporationLogoUrl(factionId, size),
        };
      }
    }

    return {
      zkillUrl: factionZkillUrl(factionId),
      portraitUrl: corporationLogoUrl(factionId, size),
    };
  }

  return {
    zkillUrl: null,
    portraitUrl: null,
  };
}

type EntityIds = {
  characterId?: number | null;
  corporationId?: number | null;
  allianceId?: number | null;
  factionId?: number | null;
  shipTypeId?: number | null;
};

export function characterZkillUrl(id: number): string {
  return `https://zkillboard.com/character/${id}`;
}

export function corporationZkillUrl(id: number): string {
  return `https://zkillboard.com/corporation/${id}`;
}

export function allianceZkillUrl(id: number): string {
  return `https://zkillboard.com/alliance/${id}`;
}

export function factionZkillUrl(id: number): string {
  return `https://zkillboard.com/faction/${id}`;
}

export function typeZkillUrl(id: number): string {
  return `https://zkillboard.com/ship/${id}/kills`;
}

export function characterPortraitUrl(id: number, size = 64): string {
  return `https://images.evetech.net/characters/${id}/portrait?size=${size}`;
}

export function corporationLogoUrl(id: number, size = 64): string {
  return `https://images.evetech.net/corporations/${id}/logo?size=${size}`;
}

export function allianceLogoUrl(id: number, size = 64): string {
  return `https://images.evetech.net/alliances/${id}/logo?size=${size}`;
}

export function shipIconUrl(typeId: number, size = 64): string {
  return `https://images.evetech.net/types/${typeId}/icon?size=${size}`;
}

export function shipRenderUrl(typeId: number, size = 64): string {
  return `https://images.evetech.net/types/${typeId}/render?size=${size}`;
}
