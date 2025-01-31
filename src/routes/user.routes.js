import {Router} from "express";
import {registerUser,loginUser, logoutUser} from '../controllers/user.controller.js'
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()
router.route('/register').post(
    //middleware
    upload.fields([
        {
            name:"avatar",
            maxCount:1    
        }
        ,
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)


    router.route("/login").post(loginUser)


    //secured routes
    //post mai do argument pe route jaata kese hai ye dekhte hai , /logout karenge tooh sabse pehle tooh vo first  argument pe hi jaayega , tooh vaha chala gaya , 
    //ab verifyJWT middleware ke andr humne likh rkha hai end hi end mai kaam hone ke baad next() , tooh iski vajhe se vo next argument pe jaayega , agar next nahi likhte tooh nahi jaata 
    router.route("/logout").post(verifyJWT,logoutUser)



export default router
