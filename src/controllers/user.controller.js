import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import {uploadonCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose"


const generateAccessAndRefereshTokens=async(userId)=>{
      try {
        const user=await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        // console.log("refresh token:",refreshToken)

        user.refreshToken=refreshToken
        // console.log("userrr:",user)
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

        
      } catch (error) {
          throw new ApiError(500,"Something went wrong while generating access or refersh token")
      }
}



const registerUser=asyncHandler(async(req,res)=>{
    //used this for the guide or basic making 
    //  res.status(200).json({
    //     message:"chai aur code"
    // })


    //Steps-
    //i)get user details from frontend
    //ii)validation:not empty
    //iii)check if user already exists:username,email
    //iv)check for images,check for avatar
    //v)upload them to clodinary,avatar
    //vi)create user object-create entry in db
    //vii)remove password and refresh token field from response
    //viii)check for user creation
    //ix)return response

    

    //i)destrucution and taking the input details which user submitted in the form or ...
    const {fullname,email,username,password}=req.body //req.body is the method to take data from the body 
    console.log("email:",email);



    //ii)validation
    if (
        [fullname, email, username, password].some(
        //   if fielde exists and after triming it , if any of them is null of undefined the throw error
          (field) => field?.trim() === ""
        )
      ) {
        // Throw an error if any field is missing or invalid
        throw new ApiError(400, "All fields are required");
      }



      //iii)check if user already exists:username,email
      //findOne returns the user which already exists and matchs our query(i.e by email,or username or ...) 
      const existedUser=await User.findOne({
        $or:[{username},{email}]
      })
      
      if(existedUser){
          throw new ApiError(409,"User with email or username already exist")
        }
      // console.log("existedUser",existedUser)



    //iv)check for images,check for avatar
        // console.log("req.files",req.files);
      const avatarLocalPath=req.files?.avatar[0]?.path ;//path laane ke liye kya kiya hai na ke req.files dekhenge sabse pehle ke vo exist krra hai ya nahi , agar exist krra hai tooh vo file ka first object jo hoga uske path method  lagayenge tooh path aa jayega
      // const coverImageLocalPath=req.files?.coverImage[0]?.path;

      let coverImageLocalPath;
      if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
          coverImageLocalPath = req.files.coverImage[0].path;
      }
      

      if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
      }



    //v)upload them to clodinary,avatar
    const avatar=await uploadonCloudinary(avatarLocalPath)
    const coverImage=await uploadonCloudinary(coverImageLocalPath)

    if(!avatar){
      throw new ApiError(400,"Avatar is required")
    }
    



    //vi)create user object-create entry in db
    const user=await User.create({
      fullname,
      avatar:avatar.url,
      coverImage:coverImage?.url||"",
      email,
      password,
      username:username.toLowerCase()
    })



    // vii)remove password and refresh token field from response
    const createdUser=await User.findById(user._id).select(
      "-password -refreshToken" //Excludes the fields password and refreshToken from the query result,The - before the field names tells Mongoose to exclude those fields.
    )



    // viii)check for user creation
    if(!createdUser){
      throw new ApiError(500,"Something went wrong while registering the user")
    }
    


    //ix)return response
    return res.status(201).json(
      new ApiResponse(200,createdUser)
    )












})


const loginUser=asyncHandler(async(req,res)=>{
    // req body se data lao
    // username or email
    //find the user
    //password check
    //access , refersh token
    //send cookies 

    const {email,username,password}=req.body
    if(!(username|| email)){
      throw new ApiError(400,"Username or email is required")
    }

    //check for the user , if this username or email user exists or not 
    const user = await User.findOne({
      $or:[{username},{email}]
    })

    //if not exists then throw error , or we can redirect to different page of register 
    if (!user){
      throw new ApiError(404,"User does not exist")
    }
    

    //NOTE:"User" jo hai vo mongoose ka ek object hai tooh usme apne pass apnne jo generateaccesstoken aur generaterefreshtoken aur ispasswordcorrect banaye the usermodels.js vo available nahi h , ye sab "user" mai avaiable hai jo database mai daala tha aur ab vaha se us user ak instance le rahe hai
    const isPasswordValid=await user.isPasswordcorrect(password)
    
    if (!isPasswordValid){
      throw new ApiError(401,"Invalid user credientials(Pawword Incorrect")
    }

    
    const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)
    // console.log("tokensss:",accessToken,refreshToken);
    

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
      httpOnly:true,
      secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          user:loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
      )
    )



})



const logoutUser=asyncHandler(async(req,res)=>{

    //user ko dhondo 
    //aur uski cookies ko delte karo


  
  //findbyidandupdate takes 3 things, filter, update, and options
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{
        refreshToken:1//this removes the field from document
      }
    },
    {
      new:true
    },
    //You should set the new option to true to return the document after update was applied.

  )




  const options={
    httpOnly:true,
    secure:true,

  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged Out"))



})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  // Check if the refresh token is missing
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: No refresh token provided");
  }

  try {
    // Verify the incoming refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token: User not found");
    }

    // Check if the token matches the stored one
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or invalid");
    }

    // Generate new tokens
    const { accessToken, newrefreshToken } = await generateAccessAndRefereshTokens(user._id);

    const options = {
      httpOnly: true,//so that it runs only on the browser 
      secure: true, // for security 
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access tokens refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});


const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body

  const user=await User.findById(req.user?._id)
  const isPasswordCorrect=user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid Old Password")

  }

  user.password=newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200,"Password changed successfully"))

})


const getcurrentuser=asyncHandler(async(req,res)=>{

  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"current user fetched successfully"))


})


const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullname,email}=req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields are required")
  }

  const user =await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname:fullname,
        email:email,
      }
    },
    {
      new:true,
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))

})


const updateUserAvatar=asyncHandler(async(req,res)=>{

  // This extracts the file path of the uploaded avatar image from the request.
  const avatarLocalPath=req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar=await uploadonCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading  avatar on cloudinary")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {
      new:true,
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar updated succesfullly"))

})


const updateUsercoverImage=asyncHandler(async(req,res)=>{

  // This extracts the file path of the uploaded avatar image from the request.
  const coverImageLocalPath=req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image file is missing")
  }

  const coverImage=await uploadonCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading coverimage on cloudinary")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {
      new:true,
    }
  ).select("-password -refreshToken")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Cover image updated succesfullly"))


})


const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  console.log("username", username);

  // Check if the username is provided and not empty
  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  // Aggregate pipeline to fetch the user's channel profile
  const channel = await User.aggregate([
    {
      // Match the user based on the provided username (case-insensitive)
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", // Collection where subscriptions are stored
        localField: "_id", // Field from the User collection (_id of the user)
        foreignField: "channel", // Field in the subscriptions collection (the subscribed channel)
        as: "subscribers", // Output array field containing subscriber documents
      },
    },
    {
      $lookup: {
        from: "subscriptions", // Same subscriptions collection
        localField: "_id", // User's _id
        foreignField: "subscriber", // Field indicating channels this user has subscribed to
        as: "subscribedTo", // Output array for subscriptions by this user
      },
    },
    {
      $addFields: {
        // Calculate the number of subscribers for the channel
        subscribersCount: {
          $size: "$subscribers",
        },
        // Calculate the number of channels this user is subscribed to
        channelSubscribedTocount: {
          $size: "$subscribedTo",
        },
        // Check if the current user is subscribed to this channel
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1, // Include full name in the response
        username: 1, // Include username
        subscribersCount: 1, // Include the count of subscribers
        channelSubscribedTocount: 1, // Include the count of subscribed channels
        isSubscribed: 1, // Include subscription status
        avatar: 1, // Include avatar image
        coverImage: 1, // Include cover image
        email: 1, // Include email address
      },
    },
  ]);

  console.log("channel:", channel);

  // Handle the case where the channel does not exist
  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  // Return the user channel profile if found
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
      {
        $match:{
          _id:new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $lookup:{
          from:"videos",
          localField:"watchHistory",
          foreignField:"_id",
          as:"watchHistory",
          pipeline:[
            {
              $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                  {
                    $project:{
                      fullName:1,
                      username:1,
                      avatar:1,    
                    }
                  },
                  {
                    $addFields:{
                      owner:{
                        $first:"$owner"
                      }
                    }
                  }
                ],
                
              }
            }

          ]
        }

      }
    ])

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    )
})




export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getcurrentuser,updateAccountDetails,updateUserAvatar,updateUsercoverImage,getUserChannelProfile,getWatchHistory}