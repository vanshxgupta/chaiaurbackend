import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from '../models/user.model.js'

export const verifyJWT=asyncHandler(async(req,_,next)=>{

    // Extracts and verifies JWT: Retrieves the token from cookies or headers and verifies it using a secret key.
    // Validates user: Fetches the user from the database, excluding sensitive data, based on the token payload.
    // Protects routes: Attaches the user to req.user if valid; otherwise, throws a 401 error for unauthorized access.


    try {
        // console.log("cookies:",req.cookies || req.header("Authorization"));
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // console.log("token:",token);
        
        // This extracts the token either from cookies or from the Authorization header.
        // In the header, the token is typically in the format: Authorization: Bearer <token>.
        //,so if we find Autorization , then replace Bearer with empty string  and we will get the token only 
        
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken ")
    
        if(!user){
            //next_video:discuss about frontend
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user=user;
        next()

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access Token")
        
    }

})

