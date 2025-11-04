import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadFileToS3 = async (
  file: Express.Multer.File
): Promise<string> => {
  const fileExtension = path.extname(file.originalname);
  const randomName = `profile-${crypto
    .randomBytes(16)
    .toString("hex")}${fileExtension}`;

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: randomName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return randomName;
};

export const getSignedFileUrl = async (key: string): Promise<string> => {
  try {
    console.log("🔍 getSignedFileUrl - Generating URL for key:", key);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    console.log("🔍 getSignedFileUrl - Generated URL:", signedUrl);
    return signedUrl;
  } catch (error) {
    console.error("❌ getSignedFileUrl - Error:", error);
    throw error;
  }
};
