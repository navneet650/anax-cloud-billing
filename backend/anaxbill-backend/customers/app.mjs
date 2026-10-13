
import {
  DynamoDBClient
} from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";

import { randomUUID } from "node:crypto";

const client = new DynamoDBClient({});

const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.CUSTOMERS_TABLE;

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  },
  body: JSON.stringify(body)
});

export const lambdaHandler = async (event) => {
  try {
    const userId =
      event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      return response(401, {
        message: "Authentication required"
      });
    }

    if (!TABLE_NAME) {
      console.error("CUSTOMERS_TABLE environment variable is missing");

      return response(500, {
        message: "Server configuration error"
      });
    }

    const method = event.httpMethod;

    if (method === "GET") {
      const result = await dynamodb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        })
      );

      return response(200, {
        customers: result.Items ?? []
      });
    }

    if (method === "POST") {
      let body;

      try {
        body = JSON.parse(event.body || "{}");
      } catch {
        return response(400, {
          message: "Request body must be valid JSON"
        });
      }

      if (
        typeof body.companyName !== "string" ||
        !body.companyName.trim()
      ) {
        return response(400, {
          message: "companyName is required"
        });
      }

      const customer = {
        ...body,
        userId,
        customerId: randomUUID(),
        companyName: body.companyName.trim(),
        createdAt: new Date().toISOString()
      };

      await dynamodb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: customer,
          ConditionExpression:
            "attribute_not_exists(userId) AND attribute_not_exists(customerId)"
        })
      );

      return response(201, { customer });
    }

    return response(405, {
      message: "Method not allowed"
    });
  } catch (error) {
    console.error("Customers API error:", error);

    return response(500, {
      message: "Internal server error"
    });
  }
};
