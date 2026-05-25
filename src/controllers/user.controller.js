import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const registerUser= asyncHandler(async (req,res)=>{
    const {username,fullname,email,password}=req.body
    
    if(
        [fullname,email,username,password].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400,"fields are required")
    }

    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"username or email already exists")
    }

    const avatarLocalPath =
req.files?.avatar?.[0]?.path;
    

    let coverImagePath;
    if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0)
        {
        coverImagePath=req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }

   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImagePath)
   if(!avatar){
    throw new ApiError(400,"avatar is required")
   }

  const user= await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url|| "",
    username:username.toLowerCase(),
    password,
    email
   })

   const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if(!createdUser){
    throw new ApiError(500,"something wrong while registering user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
   )


})

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
       const user= await User.findById(userId)
       const accessToken=user.generateAccessToken()
       const refreshToken=user.generateRefreshToken()

       user.refreshToken=refreshToken
       await user.save({validateBeforeSave:false})

       return {accessToken,refreshToken}

    } catch (error) {
           console.log(error)
       throw new ApiError(500,"something wrong while generating tokens")
    }
}


const loginUser=asyncHandler(async (req,res)=>{
    const{email,username,password}=req.body
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }

    const user= await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){       throw new ApiError(404,"username or email does not exist")
    }

   const ispasswordvalid= await user.isPasswordCorrect(password)

    if(!ispasswordvalid){
       throw new ApiError(401,"password is invalid ")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:false
    }
    return res.status(200).cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser,accessToken,refreshToken
            },"user logged in successfuly"
    )
    )
})

const logoutUser=asyncHandler(async(req ,res)=>{
    await User.findOneAndUpdate(
        req.user._id,{
            $set:{refreshToken:undefined}
        },{
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))


})

const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken|| req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
   }

  try {
     const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
     const user=await User.findById(decodedToken?._id)
  
     if(!user){
      throw new ApiError(401,"invalid refresh token")
     }
     if(incomingRefreshToken!== user?.refreshToken){
      throw new ApiError(401,"refresh token expired")
     }
  
     const options={httpOnly:true,
      secure:true
     }
  
     const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
  
     return res
     .status(200)
     .cookie("accesstoken",accessToken,options)
     .cookie("refreshtoken",newrefreshToken,options)
     .json(
      new ApiResponse(200,{accessToken,newrefreshToken},"accesstoken refresh success")
     )
  
  } catch (error) {
    throw new ApiError(401,error?.message||"invalid refresh token")
  }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confirmPassword}=req.body
    if(!oldPassword || !newPassword || !confirmPassword){
        throw new ApiError(400,"all fields are required")
    }


   const user=await User.findById(req.user._id)
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"old password is incorrect")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,{},"password changed successfully")
     )
}
)

const getCurrentUser =asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,username,email}=req.body

    if(!fullname && !username && !email){
        throw new ApiError(400,"at least one field is required to update")
    }

    User.findByIdAndUpdate(req.user._id,{
        $set:{fullname,username,email}
    },{
        new:true,
        runValidators:true
    }).select("-password -refreshToken").then((updatedUser)=>{
        if(!updatedUser){
            throw new ApiError(404,"user not found")
        }
})
return res.status(200).json(
    new ApiResponse(200,user,"account details updated successfully")
)
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath =
    req.files?.avatar?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(500,"something wrong while uploading avatar")
    }

    const updatedUser= await User.findByIdAndUpdate(req.user._id,{
        $set:{avatar:avatar.url}
    },{
        new:true
    }).select("-password -refreshToken")
    return res.status(200).json(
        new ApiResponse(200,updatedUser,"avatar updated successfully")
    )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath =
    req.files?.coverImage?.[0]?.path;   

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image is required")
    }   
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(500,"something wrong while uploading cover image")
    }

    const updatedUser= await User.findByIdAndUpdate(req.user._id,{
        $set:{coverImage:coverImage.url}
    },{
        new:true
    }).select("-password -refreshToken")
    return res.status(200).json(
        new ApiResponse(200,updatedUser,"cover image updated successfully")
    )
}
)



export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar
,updateUserCoverImage
}