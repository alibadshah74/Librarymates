import ImageKit from "imagekit";

if (!process.env.IMAGEKIT_PUBLIC_KEY) {
    console.log("Publickey is undefined")
  throw new Error("Missing IMAGEKIT_PUBLIC_KEY");
}

var imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT,
});

export default imagekit