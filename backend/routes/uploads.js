import express from 'express';
import AWS from 'aws-sdk';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Configure AWS SDK v2 (credentials should be provided via environment variables)
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

// Helper to build a safe S3 object key
function buildObjectKey(userId, folder, fileName) {
  const safeFolder = (folder || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '');
  const ext = fileName && fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
  const base = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  return `${safeFolder}/${userId}/${base}${ext}`;
}

// POST /api/uploads/presign
// Body: { fileName: string, contentType: string, folder?: string }
router.post('/presign', auth, async (req, res) => {
  try {
    const { fileName, contentType, folder } = req.body || {};

    if (!process.env.S3_BUCKET_NAME || !process.env.AWS_REGION) {
      return res.status(500).json({ message: 'S3 is not configured on the server' });
    }

    if (!fileName || !contentType) {
      return res.status(400).json({ message: 'fileName and contentType are required' });
    }

    const key = buildObjectKey(req.user._id?.toString() || 'anonymous', folder || 'community-logos', fileName);

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Expires: 60 
    };

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

    const publicBase = process.env.S3_PUBLIC_BASE_URL || `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const url = `${publicBase}/${key}`;

    return res.json({ uploadUrl, key, url });
  } catch (error) {
    console.error('Error generating S3 presigned URL:', error);
    return res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});

export default router;

