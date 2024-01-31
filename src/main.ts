import { loadEnv } from './config/config';
import { fetchAdvertsData, fetchLogsData } from './functions/fetchData';
import { normalizeAdvert, normalizeLogs, validToNormalizeAdvert } from './functions/normalizeData';
import { saveMigrationError, saveMigrationInfo, saveUpdatedAdvert, saveUpdatedLogs } from './functions/saveData';

async function main() {
  console.log('Running script');
  const startTime = new Date().getTime();
  const advertsToIgnore = [];

  let noMoreData = false;

  while (!noMoreData) {
    let finishedMigratingCampaign = false;

    const foundOldAdvert = await fetchAdvertsData(advertsToIgnore);

    if (!foundOldAdvert) {
      noMoreData = true;
      break;
    }

    const validToNormalize = validToNormalizeAdvert(foundOldAdvert);
    if (!validToNormalize) {
      advertsToIgnore.push(foundOldAdvert._id);
      await saveMigrationError(foundOldAdvert, 'Advert not valid to normalize');
      continue;
    }

    const normalizedAdvert = normalizeAdvert(foundOldAdvert);

    await saveMigrationInfo(foundOldAdvert, normalizedAdvert);

    const migrationReference = {
      oldCampaignId: foundOldAdvert.campaignId,
      newCampaignId: normalizedAdvert._id,
      creatives: normalizedAdvert.creatives.map((creative: any, index: number) => {
        return {
          oldCreativeId: foundOldAdvert.creatives[index].id,
          newCreativeId: creative.creativeId,
        };
      }),
    };

    while (!finishedMigratingCampaign) {
      const foundLogs = await fetchLogsData(migrationReference);

      if (!foundLogs) {
        break;
      }

      if (foundLogs.length === 0) {
        finishedMigratingCampaign = true;
        break;
      }

      const normalizedLogs = normalizeLogs(foundLogs, migrationReference);
      await saveUpdatedLogs(normalizedLogs);
    }

    await saveUpdatedAdvert(normalizedAdvert);
  }

  console.log('Finished script');
  const endTime = new Date().getTime();
  console.log('Execution time: ', endTime - startTime, 'ms');
}

loadEnv();
main();
