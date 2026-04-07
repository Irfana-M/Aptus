import { injectable } from 'inversify';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/config/s3Config";

@injectable()
export class ImageService {
  async getSignedImageUrl(imageKey: string): Promise<string | null> {
    try {
      if (!imageKey) return null;

      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET!,
        Key: imageKey,
      });

      return await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
      });
    } catch (error) {
      console.error("Error generating signed URL for image:", imageKey, error);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async addImageUrlsToMentors(mentors: any[]): Promise<any[]> {
    return await Promise.all(
      mentors.map(async (mentor) => {
        if (mentor.profileImageKey) {
          mentor.profileImageUrl = await this.getSignedImageUrl(
            mentor.profileImageKey
          );
        }
        return mentor;
      })
    );
  }
}
