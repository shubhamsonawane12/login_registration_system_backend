import express from 'express'
import bcrypt from 'bcrypt';
import multer from 'multer';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import authMiddleware from "../middleware/auth.middleware.js";
import { User } from '../model/user.model.js';

const router = express.Router();
// dotenv.config(); 
 
 
router.post('/register',async(req , res)=>{
try{

            const {name,dob,email,password}=req.body;
            const existingUser = await User.findOne({email});
            if(existingUser){
                return res.status(400).json({message:"User already exists"});

            }
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password,salt);
                const newUser = new User({
                    name,
                    dob,
                    email,
                    password:hashedPassword,
                })
                await newUser.save();
                const token =jwt.sign(
                    {userId:newUser._id},
                    process.env.JWT_SECRET,
                    {expiresIn:'3h'}


                );
                res.status(200).json({token, message:'User created succesfully'});

}catch(error){
    console.log(error);
    res.status(500).json({message:'Error in creating'});
}
})


router.post ('/login',async (req , res )=>{
    try{
        const {email , password}=req.body;
        const user = await User.findOne({email});
        if (!user){
            return res.status(400).json({message:'invalid credentials'});

        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch){
            return res.status(400).json({message:'invalid credentials'});
        }

        const token = jwt.sign(

            {userId:user._id},
            process.env.JWT_SECRET,

                {expiresIn:'3h'}
            

        );
        res.status(200).json({token});
    } catch (error){
        res.status(500).json({message: 'Server error'})
    }
});

router.get('/users', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    } 

    // Send the users array to the frontend
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // You can access the authenticated user's ID from req.userId (assuming your authMiddleware sets this)
    const userId = req.userId;
    
    console.log("user_id from auth:",userId);
    // Fetch user details from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the user details to the frontend
    res.status(200).json({
      userId:userId,
      name: user.name,
      email: user.email,
      dob: user.dob,
    
      
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;
