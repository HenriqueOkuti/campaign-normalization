import { ObjectId } from 'mongodb';

export function normalizeAdvert(oldAdvert: any) {
  const updatedAdvert = {
    ...oldAdvert,
    creatives: oldAdvert.creatives.map((oldCreative: any) => {
      const updatedCreative = {
        ...oldCreative,
        creativeId: new ObjectId(),
      };

      if (updatedCreative.id) {
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

export function normalizeLogs(logs: any, migrationReference: any) {
  const migrationRefDictionary = migrationReference.creatives.reduce((acc: any, curr: any) => {
    acc[curr.oldCreativeId] = curr.newCreativeId;
    return acc;
  }, {});

  return logs.map((log: any) => {
    const updatedCreativeInfo = {
      ...log.creative,
      creativeId: migrationRefDictionary[log.creative.id],
    };

    if (updatedCreativeInfo.id) {
      delete updatedCreativeInfo.id;
    }

    return {
      ...log,
      campaignId: migrationReference.newCampaignId,
      creative: updatedCreativeInfo,
    };
  });
}
