import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "ap-south-1";
const s3 = new S3Client({ region });

export const PDF_BUCKET = process.env.PDF_BUCKET;

export async function uploadPdf(key, buffer) {
  await s3.send(new PutObjectCommand({
    Bucket: PDF_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
  }));
  return key;
}

export async function getPdfUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: PDF_BUCKET, Key: key });
  return await getSignedUrl(s3, command, { expiresIn });
}

export async function getPdfBuffer(key) {
  const result = await s3.send(new GetObjectCommand({ Bucket: PDF_BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of result.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}
