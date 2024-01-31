import { loadEnv } from './config/config';
import { fetchAdvertsData, fetchLogsData } from './functions/fetchData';
import { normalizeAdvert, normalizeLogs } from './functions/normalizeData';
import { saveMigrationInfo, saveUpdatedAdvert, saveUpdatedLogs } from './functions/saveData';

async function main() {
  console.log('Running script');
  console.time('script');

  let noMoreData = false;

  while (!noMoreData) {
    let finishedMigratingCampaign = false;

    const foundOldAdvert = await fetchAdvertsData();

    if (!foundOldAdvert) {
      noMoreData = true;
      break;
    }

    const normalizedAdvert = normalizeAdvert(foundOldAdvert);

    await saveMigrationInfo(foundOldAdvert, normalizedAdvert);
    await saveUpdatedAdvert(normalizedAdvert);

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

      if (foundLogs.length === 0) {
        finishedMigratingCampaign = true;
        break;
      }

      const normalizedLogs = normalizeLogs(foundLogs, migrationReference);
      await saveUpdatedLogs(normalizedLogs);
    }
  }

  console.log('Finished script');
  console.timeEnd('script');
}

loadEnv();
main();
