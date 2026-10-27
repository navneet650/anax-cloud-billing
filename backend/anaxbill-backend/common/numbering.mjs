import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" });
const ddb = DynamoDBDocumentClient.from(client);

const COUNTERS_TABLE = process.env.COUNTERS_TABLE;

export function currentFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${String(endYear).slice(-2)}`;
}

export async function nextInvoiceNumber(companyId, prefix = "INV-", startingNumber = 1) {
  const fy = currentFinancialYear();
  const counterKey = { companyId, counterId: `invoice:${fy}` };

  try {
    const result = await ddb.send(
      new UpdateCommand({
        TableName: COUNTERS_TABLE,
        Key: counterKey,
        UpdateExpression: "ADD #n :one SET fy = :fy, prefix = :prefix, updatedAt = :now",
        ExpressionAttributeNames: { "#n": "seq" },
        ExpressionAttributeValues: {
          ":one": 1,
          ":fy": fy,
          ":prefix": prefix,
          ":now": new Date().toISOString(),
        },
        ReturnValues: "UPDATED_NEW",
      })
    );
    const seq = result.Attributes.seq;
    return `${prefix}${String(seq).padStart(4, "0")}`;
  } catch (err) {
    if (err.name === "ValidationException" || err.__type?.includes("ResourceNotFound")) {
      const existing = await ddb.send(
        new GetCommand({ TableName: COUNTERS_TABLE, Key: counterKey })
      );
      if (!existing.Item) {
        await ddb.send(
          new PutCommand({
            TableName: COUNTERS_TABLE,
            Item: {
              ...counterKey,
              seq: Number(startingNumber),
              fy,
              prefix,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          })
        );
        return `${prefix}${String(startingNumber).padStart(4, "0")}`;
      }
    }
    throw err;
  }
}
