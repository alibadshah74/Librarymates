import ImageKit from "imagekit";

const required = [
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(` Missing environment variable: ${key}`);
  }
}

var imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT,
});

console.log("✅ ImageKit initialized with publicKey:", process.env.IMAGEKIT_PUBLIC_KEY ? "Present" : "Missing");

export default imagekit