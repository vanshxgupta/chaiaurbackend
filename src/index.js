// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
// import mongoose from "mongoose";
// import  DB_NAME  from "./constants";
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

//method-2 (db connectionn code kahi aur likha hai aur is wali mai sirf connect krenge usko)

connectDB()


//method-1 to connect the db i.e to directly connect t in the index file 

// import express from "express"
// const app=express()


// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERRR:",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port  ${process.env.PORT}`)
//         })

//     } catch (error) {
//         console.log("ERROR aaya hai:",error);
//     }
// })()