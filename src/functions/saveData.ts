import { MongoClient, AnyBulkWriteOperation } from 'mongodb';

export async function saveMigrationInfo(oldAdvert: any, newAdvert: any) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const database = client.db(process.env.DB_NAME);
  const collection = database.collection('adverts.migration');

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
          newCreativeId: creative._id,
        };
      }),
    });

    return;
  } catch (e) {
    console.log('Error saving migration info');
    console.error(e);
  } finally {
    await client.close();
  }
}

export async function saveMigrationError(errorAdvert: any, message: string) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const database = client.db(process.env.DB_NAME);
  const collection = database.collection('adverts.migration');

  try {
    await client.connect();
    await collection.insertOne({
      errorAdvert: errorAdvert,
      message: message,
    });

    return;
  } catch (e) {
    console.log('Error saving migration error');
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
    console.log('Error saving updated advert');
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

  try {
    await client.connect();

    const bulkOperations: AnyBulkWriteOperation<any>[] = updatedLogs.map((log: any) => ({
      updateOne: {
        filter: { _id: log._id },
        update: {
          $set: {
            campaignId: log.campaignId,
            creative: log.creative,
          },
        },
      },
    }));

    await collection.bulkWrite(bulkOperations);
  } catch (e) {
    console.log('Error saving updated logs');
    console.error(e);
  } finally {
    await client.close();
  }
}

export async function saveMigratedInfo(migrationData: any, status: boolean) {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const database = client.db(process.env.DB_NAME);
  const collection = database.collection('adverts.migration');

  try {
    await client.connect();

    await collection.updateOne(
      {
        _id: migrationData._id,
      },
      {
        $set: {
          migrated: status,
          migrating: false,
        },
      },
    );
  } catch (e) {
    console.log('Error saving migrated info');
    console.error(e);
  } finally {
    await client.close();
  }
}
