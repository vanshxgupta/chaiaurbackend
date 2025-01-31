import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model"
import {uploadonCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



const generateAccessAndRefereshTokens=async(userId)=>{
      try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
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
      console.log("existedUser",existedUser)



    //iv)check for images,check for avatar
        console.log("req.files",req.files);
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
      $set:{
        refreshToken:undefined
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


export {registerUser,loginUser,logoutUser}