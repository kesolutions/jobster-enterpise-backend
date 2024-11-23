const path = require("path");
const { Storage } = require('@google-cloud/storage');

const gcs = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = gcs.bucket(bucketName);

const uploadToCloudStorage = async (filePath) => {
  const destination = path.basename(filePath);
  try {
    await bucket.upload(filePath, {
      destination,
      gzip: true,
    });
    console.log(`File uploaded to ${bucketName}/${destination}`);
    return `https://storage.googleapis.com/${bucketName}/${destination}`;
  } catch (err) {
    console.error(`Error uploading file to Cloud Storage: ${err.message}`);
    throw err;
  }
};

module.exports = {
  uploadToCloudStorage,
};
