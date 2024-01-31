import { ObjectId } from 'mongodb';

export function normalizeAdvert(oldAdvert: any) {
  const updatedAdvert = {
    ...oldAdvert,
    creatives: oldAdvert.creatives.map((oldCreative: any) => {
      const updatedCreative = {
        ...oldCreative,
        creativeId: new ObjectId(),
      };

      if (!!updatedCreative.id) {
        delete updatedCreative.id;
      }

      return updatedCreative;
    }),
  };

  if (updatedAdvert.campaignId) {
    delete updatedAdvert.campaignId;
  }

  return updatedAdvert;
}

export function validToNormalizeAdvert(advert: any) {
  if (!advert.campaignId) {
    return false;
  }

  advert.creatives.forEach((creative) => {
    if (!creative.id) {
      return false;
    }
  });

  return true;
}

export function normalizeLogs(logs: any, migrationReference: any) {
  const migrationRefDictionary = migrationReference.creatives.reduce((acc: any, curr: any) => {
    acc[curr.oldCreativeId] = new ObjectId(curr.newCreativeId).toString();
    return acc;
  }, {});

  return logs.map((log: any) => {
    const updatedCreativeInfo = {
      ...log.creative,
      creativeId: migrationRefDictionary[log.creative.id],
    };

    if (!!updatedCreativeInfo.id) {
      delete updatedCreativeInfo.id;
    }

    return {
      ...log,
      campaignId: new ObjectId(migrationReference.newCampaignId).toString(),
      creative: updatedCreativeInfo,
    };
  });
}
