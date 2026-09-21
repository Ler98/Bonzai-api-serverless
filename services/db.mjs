import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

// hämta DynamoDB-databasen från AWS
const client = new DynamoDB();

export const db = DynamoDBDocument.from(client);
