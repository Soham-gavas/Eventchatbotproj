import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import OpenAI from "openai"

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const ASTRA_DB_NAMESPACE="default_keyspace"
const ASTRA_DB_COLLECTION="eventmastergpt"
const ASTRA_DB_API_ENDPOINT="https://7bb02b78-a11a-45cb-ba05-96f4da9092d1-us-east-2.apps.astra.datastax.com"
const ASTRA_DB_APPLICATION_TOKEN="AstraCS:mdqPwHvFfLioneglrUZawQTh:98e0c045ab63ad961dbf850fdbfdc6817a60a57bad19663353808b727dd15200"
const OPENAI_API_KEY_2="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"

const OPENAI_API_KEY="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"
const OPENAI_API_ENDPOINT="https://models.inference.ai.azure.com"
const ASTRA_DB_URL="https://default_keyspace.7bb02b78-a11a-45cb-ba05-96f4da9092d1-us-east-2.apps.astra.datastax.com"



const openai = new OpenAI({
    baseURL: OPENAI_API_ENDPOINT,
    apiKey: OPENAI_API_KEY,
})

const eventData = [
    'https://www.eventbrite.com/d/india--mumbai/events/',
    'https://in.bookmyshow.com/explore/events-mumbai',
    'https://www.townscript.com/in/mumbai?page=2'
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetric
        }
    })
    console.log(res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await (const url of eventData) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await(const chunk of chunks) {
            const embedding =  await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float"
            })

            const vector = embedding.data[0].embedding
            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })
            console.log(res)
        }
    }
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    return ( await loader.scrape()).replace(/<[^>]*>?/gm, '')
}

createCollection().then(() => loadSampleData())
