import {Router} from "express";
import {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getcurrentuser,updateAccountDetails,updateUserAvatar,updateUsercoverImage,getUserChannelProfile} from '../controllers/user.controller.js'
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
    router.route("/refreshtoken").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT, changeCurrentPassword)
    router.route("/current-user").get(verifyJWT, getcurrentuser)
    router.route("/update-account").patch(verifyJWT, updateAccountDetails)

    router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
    router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUsercoverImage)
    router.route("/getUserChannelProfile/:username").get(verifyJWT,getUserChannelProfile)



export default router
