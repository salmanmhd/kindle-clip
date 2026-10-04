import fs from 'fs';
import { processImport } from '../lib/kindle/import';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  console.time('Generate 5000 entries');
  let fixture = '';
  for (let i = 0; i < 5000; i++) {
    fixture += `Book ${i % 100} (Author)\n- Your Highlight on Location ${i}-${i} | Added on Sunday, October 4, 2026 10:00:00 AM\n\nHighlight ${i}\n==========\n`;
  }
  console.timeEnd('Generate 5000 entries');

  const userId = new mongoose.Types.ObjectId().toString();

  console.time('Import 5000 entries');
  await processImport(userId, fixture, 'test.txt');
  console.timeEnd('Import 5000 entries');

  await mongoose.disconnect();
  await mongoServer.stop();
}

run().catch(console.error);
