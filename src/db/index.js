import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB =async ()=> {
    try{
     const connectionINstance= await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
     console.log(`\n mongodb connected !!:${connectionINstance.connection.host}`);
        
    }catch(error){
        console.log("connection error",error);
        process.exit(1)
    }

}
export default connectDB