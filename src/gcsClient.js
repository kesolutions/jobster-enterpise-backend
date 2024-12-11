const path = require("path");
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require("uuid");

const gcs = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucketName = process.env.BUCKET_NAME;
const bucket = gcs.bucket(bucketName);

const uploadToCloudStorage = async (filePath, originalName) => {
  const uuid = uuidv4();
  const fileExtension = path.extname(originalName);
  const baseName = path.basename(originalName, fileExtension);
  const destination = `${baseName}-${uuid}${fileExtension}`;

  try {
    await bucket.upload(filePath, {
      destination,
      gzip: true,
    });
    return destination;
  } catch (err) {
    console.error(`Error uploading file to Cloud Storage: ${err.message}`);
    throw err;
  }
};

const generateSignedUrl = async (fileName, expiresInSeconds = 3600) => {
  const file = bucket.file(fileName);

  try {
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expiresInSeconds * 1000,
    });
    return url;
  } catch (err) {
    console.error(`Error generating signed URL: ${err.message}`);
    throw err;
  }
};

module.exports = {
  uploadToCloudStorage,
  generateSignedUrl,
};
