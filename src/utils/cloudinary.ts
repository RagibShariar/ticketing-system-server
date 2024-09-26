import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { config } from "../config";

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

export const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null; // if the file path is not provided, return null

    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfully
    //console.log("file is uploaded on cloudinary ", response.url);

    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got successful
    return response;
  } catch (error) {
    console.log("error in cloudinary", error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};
