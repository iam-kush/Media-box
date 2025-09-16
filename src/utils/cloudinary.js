import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUDNAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary =async(localfilepath)=>{
    try{
        if(!localfilepath) return null

        const response =await clodinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        })
        console.log(response)
        return response;
    }catch(error){
        fs.unlinkSync(localfilepath)//remove locally saved file as failed
        return null
    }

}

export {uploadOnCloudinary}