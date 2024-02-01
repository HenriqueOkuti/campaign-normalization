import { MongoClient, ObjectId } from 'mongodb';

export async function fetchAdvertsData(advertsToIgnore: Array<ObjectId>) {
  let currAdvert = undefined;

  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  const advertsPriority = [{ campaignId: 6875505 }, { campaignId: 6875100 }];

  try {
    await client.connect();
    const database = client.db(process.env.DB_NAME);
    const collection = database.collection('adverts');

    for (const advert of advertsPriority) {
      currAdvert = await collection.findOne(advert);

      switch (!!currAdvert) {
        case true:
          break;

        case false:
          advertsPriority.shift();
      }
    }

    if (currAdvert) {
      return currAdvert;
    }

    currAdvert = await collection.findOne({
      campaignId: { $exists: true },
      _id: { $nin: advertsToIgnore },
    });

    if (currAdvert) {
      return currAdvert;
    }
  } catch (e) {
    console.log('Error fetching advert data');
    console.error(e);
  } finally {
    await client.close();
  }
}

export async function fetchLogsData(migrationReference: any) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  const logsToProcessSize = 100000;

  try {
    await client.connect();

    const database = client.db(process.env.DB_NAME);
    const collection = database.collection('banners.token.v2');

    const logs = await collection
      .find(
        {
          campaignId: migrationReference.oldCampaignId,
          'creative.id': {
            $in: migrationReference.creatives.map((creative: any) => creative.oldCreativeId),
          },
        },
        { limit: logsToProcessSize },
      )
      .toArray();

    return logs;
  } catch (e) {
    console.log('Error fetching logs data');
    console.error(e);
  } finally {
    await client.close();
  }
}
