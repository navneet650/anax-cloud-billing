import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-south-1" });
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  CUSTOMERS: process.env.CUSTOMERS_TABLE,
  PRODUCTS: process.env.PRODUCTS_TABLE,
  INVOICES: process.env.INVOICES_TABLE,
  SETTINGS: process.env.SETTINGS_TABLE,
  COUNTERS: process.env.COUNTERS_TABLE,
};

export async function putItem(table, item) {
  await ddb.send(new PutCommand({ TableName: table, Item: item }));
  return item;
}

export async function getItem(table, key) {
  const result = await ddb.send(new GetCommand({ TableName: table, Key: key }));
  return result.Item || null;
}

export async function queryByCompany(table, companyId, extra = {}) {
  const params = {
    TableName: table,
    KeyConditionExpression: "companyId = :cid",
    ExpressionAttributeValues: { ":cid": companyId },
    ...extra,
  };
  const result = await ddb.send(new QueryCommand(params));
  return result.Items || [];
}

export async function updateItem(table, key, updates) {
  const setExprs = [];
  const removeExprs = [];
  const names = {};
  const values = {};

  let i = 0;
  for (const [field, value] of Object.entries(updates)) {
    i++;
    const nameKey = `#f${i}`;
    names[nameKey] = field;
    if (value === undefined || value === null) {
      removeExprs.push(nameKey);
    } else {
      setExprs.push(`${nameKey} = :v${i}`);
      values[`:v${i}`] = value;
    }
  }

  const parts = [];
  if (setExprs.length) parts.push("SET " + setExprs.join(", "));
  if (removeExprs.length) parts.push("REMOVE " + removeExprs.join(", "));

  const result = await ddb.send(
    new UpdateCommand({
      TableName: table,
      Key: key,
      UpdateExpression: parts.join(" "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
      ReturnValues: "ALL_NEW",
    })
  );
  return result.Attributes;
}

export async function deleteItem(table, key) {
  await ddb.send(new DeleteCommand({ TableName: table, Key: key }));
}
