const sharp = require("sharp");
const input = process.argv[2];
Promise.all([
  sharp(input).resize(192, 192).png().toFile("public/icons/192.png"),
  sharp(input).resize(512, 512).png().toFile("public/icons/512.png"),
]).then(() => console.log("OK"));
