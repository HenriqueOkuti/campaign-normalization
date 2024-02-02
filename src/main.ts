import { ObjectId } from 'mongodb';
import { loadEnv } from './config/config';
import { fetchAdvertsData, fetchLogsData } from './functions/fetchData';
import { normalizeAdvert, normalizeLogs, validToNormalizeAdvert } from './functions/normalizeData';
import { saveMigrationError, saveMigrationInfo, saveUpdatedAdvert, saveUpdatedLogs } from './functions/saveData';

async function main() {
  console.log('Running script');
  const startTime = new Date().getTime();
  const advertsToIgnore = [new ObjectId('6528736489cc5c327b544e7a')];

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

    saveMigrationInfo(foundOldAdvert, normalizedAdvert);
    await saveUpdatedAdvert(normalizedAdvert);

    const migrationReference = {
      oldCampaignId: foundOldAdvert.campaignId,
      newCampaignId: normalizedAdvert._id,
      creatives: normalizedAdvert.creatives.map((creative: any, index: number) => {
        return {
          oldCreativeId: foundOldAdvert.creatives[index].id,
          newCreativeId: creative._id,
        };
      }),
    };

    console.log(
      'Executing migration for campaign: ',
      migrationReference.oldCampaignId,
      'to',
      migrationReference.newCampaignId,
    );

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
  }

  console.log('Finished script');
  const endTime = new Date().getTime();
  console.log('Execution time: ', endTime - startTime, 'ms');
}

loadEnv();
main();
