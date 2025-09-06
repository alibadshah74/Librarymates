import ImageKit from "imagekit";

try {
    var imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT

});
} catch (error) {
    console.log(error)
}


export default imagekit