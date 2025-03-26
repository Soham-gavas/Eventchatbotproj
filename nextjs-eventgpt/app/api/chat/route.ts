import OpenAI from "openai"
import { OpenAIStream, StreamingTextResponse } from "langchain/llms/openai"
import { DataAPIClient} from "@datastax/astra-db-ts"
import { embed } from "ai"
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression"

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
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE})

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()
        const latestMessage = messages[messages.length - 1]?.content

        let docContext = ""

        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessage,
            encoding_format: "float"
        })

        try {
            const collection =  await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null,{
                sort: {
                    $vector: embedding.data[0].embedding,
                },
                limit: 10
            }) 

            const documents = await cursor.toArray()
            
            const docsMap =  documents?.map(doc => doc.text)
            
            docContext = JSON.stringify(docsMap)
        
        } catch(err) {
        console.log("Error querying db...")
        docContext = ""
        } 

        const template = {
            role: "system",
            content: `You are an AI assistant who knows everything about Formula One. Use the below context to augment what you know about Formula One racing. The context will provide you with the most recent page data from Wikipedia, the official F1 website, and others.
            If the context doesn't include the information you need, answer based on your existing knowledge and don't mention the source of your information or what the context does or doesn't include.
            Format responses using markdown where applicable and don't return images.

            -----------------
            START CONTEXT
            ${docContext}
            END CONTEXT
            -----------------
            QUESTION: ${latestMessage}
            -----------------`
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: true,
            messages: [template, ...messages]
       })

       const stream = OpenAIStream(response)
       return new StreamingTextResponse(stream)
    } catch (err){
        throw err
    }
} 
