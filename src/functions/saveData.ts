import { MongoClient } from 'mongodb';

export async function saveMigrationInfo(oldAdvert: any, newAdvert: any) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const database = client.db(process.env.DB_NAME);
  const collection = database.collection('advertsMigration');

  try {
    await client.connect();
    await collection.insertOne({
      oldAdvert: oldAdvert,
      newAdvert: newAdvert,
      oldCampaignId: oldAdvert.campaignId,
      newCampaignId: newAdvert._id,
      creatives: newAdvert.creatives.map((creative: any, index: number) => {
        return {
          oldCreativeId: oldAdvert.creatives[index].id,
          newCreativeId: creative.creativeId,
        };
      }),
    });

    return;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

export async function saveUpdatedAdvert(updatedAdvert: any) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const database = client.db(process.env.DB_NAME);
  const collection = database.collection('adverts');

  try {
    await client.connect();

    await collection.replaceOne(
      {
        _id: updatedAdvert._id,
      },
      updatedAdvert,
    );
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

export async function saveUpdatedLogs(updatedLogs: any) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const database = client.db(process.env.DB_NAME);
  const collection = database.collection('banners.token.v2');

  const parallelPromisesQuantity = 10;
  const subArrays = splitIntoSubArrays(updatedLogs, parallelPromisesQuantity);

  try {
    await client.connect();

    for (const subArray of subArrays) {
      await Promise.all(
        subArray.map(async (log: any) => {
          return collection.updateOne(
            {
              _id: log._id,
            },
            {
              $set: {
                campaignId: log.campaignId,
                creative: log.creative,
              },
            },
          );
        }),
      );
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

function splitIntoSubArrays(array: any, size: number) {
  const subArrays = [];
  for (let i = 0; i < array.length; i += size) {
    subArrays.push(array.slice(i, i + size));
  }
  return subArrays;
}