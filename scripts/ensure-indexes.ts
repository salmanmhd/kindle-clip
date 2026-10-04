import mongoose from 'mongoose';
import { User } from '../lib/models/User';
import { Book } from '../lib/models/Book';
import { Highlight } from '../lib/models/Highlight';
import { Import } from '../lib/models/Import';

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Syncing indexes for User...');
    await User.syncIndexes();

    console.log('Syncing indexes for Book...');
    await Book.syncIndexes();

    console.log('Syncing indexes for Highlight...');
    await Highlight.syncIndexes();

    console.log('Syncing indexes for Import...');
    await Import.syncIndexes();

    console.log('All indexes synced successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing indexes:', error);
    process.exit(1);
  }
}

run();
