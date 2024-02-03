import { loadEnv } from './config/config';
import { fetchLogsData, fetchMigrationData } from './functions/fetchData';
import { normalizeLogs } from './functions/normalizeData';
import { saveMigratedInfo, saveUpdatedLogs } from './functions/saveData';

async function main() {
  console.log('Running script');
  const startTime = new Date().getTime();

  let noMoreData = false;

  while (!noMoreData) {
    let finishedMigratingCampaign = false;

    const migrationData = await fetchMigrationData();

    if (!migrationData) {
      noMoreData = true;
      break;
    }

    const migrationReference = {
      oldCampaignId: migrationData.oldCampaignId,
      newCampaignId: migrationData.newCampaignId,
      creatives: migrationData.creatives,
    };

    console.log(
      'Executing migration for campaign: ',
      migrationReference.oldCampaignId,
      'to',
      migrationReference.newCampaignId,
    );

    console.log(migrationReference);

    let i = 0;
    while (!finishedMigratingCampaign) {
      console.log(`At: ${new Date()}  |  `, 'Executing migration for batch: ', i++);
      const foundLogs = await fetchLogsData(migrationReference);

      if (!foundLogs) {
        finishedMigratingCampaign = true;
        break;
      }

      if (foundLogs.length === 0) {
        finishedMigratingCampaign = true;
        break;
      }

      const normalizedLogs = normalizeLogs(foundLogs, migrationReference);
      await saveUpdatedLogs(normalizedLogs);
    }

    await saveMigratedInfo(migrationData, finishedMigratingCampaign);
    console.log(
      'Finished migrating campaign: ',
      migrationReference.oldCampaignId,
      ' to ',
      migrationReference.newCampaignId,
    );
  }

  console.log('Finished script');
  const endTime = new Date().getTime();
  console.log('Execution time: ', endTime - startTime, 'ms');
}

loadEnv();
main();
