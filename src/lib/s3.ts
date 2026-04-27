import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function getClient(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  return new S3Client({
    region: process.env.S3_REGION!,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

export async function presignPutObject(params: {
  tenantId: string;
  postId: string;
  originalFilename: string;
  mimeType: string;
}): Promise<{ storageKey: string; uploadUrl: string }> {
  const bucket = process.env.S3_BUCKET!;
  const safeName = params.originalFilename.replace(/[^\w.\-一-龥ぁ-んァ-ン]/g, "_");
  const storageKey = `${params.tenantId}/${params.postId}/${randomUUID()}-${safeName}`;

  const client = getClient();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: params.mimeType,
  });
  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: 60 * 15 });
  return { storageKey, uploadUrl };
}

export async function presignGetObject(storageKey: string): Promise<string> {
  const bucket = process.env.S3_BUCKET!;
  const client = getClient();
  const get = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
  return getSignedUrl(client, get, { expiresIn: 60 * 10 });
}

export async function deleteObject(storageKey: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: storageKey,
    }),
  );
}
