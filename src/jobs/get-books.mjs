import dotenv from 'dotenv';
import MongoClient from '../classes/MongoClient.mjs';
import GptClient from '../classes/GptClient.mjs';
import { sleep } from '../helpers/util.mjs';
import fetch from 'node-fetch';

dotenv.config();

const dbTimeout = 200;
const gptApiKey = process.env.OPEN_AI_APIKEY;
const dbPassword = process.env.MONGO_DB_ATLAS_PW;

const dbName = 'contextone-db';
const collectionName = 'books';
const collectionNameCache = 'gpt-query-cache';
const collectionNameErrors = 'gpt-query-errors';
const uidKeys = ['name'];
// Replace the following with your MongoDB Atlas connection string
const dbUri = `mongodb+srv://admin:${dbPassword}@cluster0.nypjnvx.mongodb.net/?retryWrites=true&w=majority`;

/** @var MongoClient */
const mongoClient = new MongoClient(
  dbName,
  dbPassword,
  dbUri,
  collectionName,
  collectionNameCache,
  collectionNameErrors,
  uidKeys
);

const gptClient = new GptClient(gptApiKey, mongoClient);
const query = `Give me a list of the 10 best non fiction books of 2023. Return the list as JSON array of objects.
Each object has the properties title, author and releaseDate. Make sure the response is valid JSON.`;

async function run() {
    const response = await gptClient.getJsonQuery(query);
    let books = []
    try {
      books = JSON.parse(response);
    } catch (error) {
      console.log(error);
      process.exit();
    }
    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        await mongoClient.createDocument(book);
        await sleep(dbTimeout);
    }

  await mongoClient.disconnect();
}

run();//done