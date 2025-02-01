import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const userSchema = new Schema({
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: [true, "Full name is required"],
        lowercase: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String, // Cloudinary URL
        required: [true, "Avatar URL is required"],
    },
    coverImage: {
        type: String, // Cloudinary URL
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String,
    },
}, { timestamps: true });

userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10)
    next()
})

//creating custom methods
userSchema.methods.isPasswordcorrect=async function(password){
    return await bcrypt.compare(password,this.password)

}

userSchema.methods.generateAccessToken=function(){
    const accesstoken=jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        },

    )
    return accesstoken;
}

userSchema.methods.generateRefreshToken=function(){
    const refreshtoken=jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        },

    )
    return refreshtoken;
}

export const User = mongoose.model("User", userSchema);
