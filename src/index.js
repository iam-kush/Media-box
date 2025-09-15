
import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"

dotenv.config({
    path:'./env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5000 , ()=>{
        console.log(`server is running at ${process.env.PORT}`);
    })
})
.catch()((error)=>{
    console.log("connection failed",error);
})



















/*
import express from "express";

const app=express()
( async ()=>{
    try{
        mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",()=>{
            console.log(error);
            throw err
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on {process.env.PORT}` );
        })


    }catch(error){
        console.error("error:",error)
        throw err
    }
})()
    */

