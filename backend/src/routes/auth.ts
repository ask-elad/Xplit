import { Router } from "express";
import bcrypt from 'bcrypt'
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
const client = new PrismaClient();

import authMiddleware from '../middleware/authMiddleware';


require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;


export const userRouter = Router();

userRouter.post('/signup', async (req,res) =>{

    const username = req.body.username;
    const password = req.body.password;

    const hashedPassword = (await bcrypt.hash(password, 5)).toString();

    try {
        await client.user.create({
            data: {
                username,
                password: hashedPassword
            }
        });

        res.status(201).json({ message: "You have signed up successfully!!" });

    }catch (e) {
        res.status(400).json({ message: "Sign up failed! Username may already exist." });
    }
  
})

userRouter.post('/signin', async (req,res)=> {
    const username = req.body.username;
    const password = req.body.password;


    const response = await client.user.findUnique({
        where:{
            username : username
        }
    })

    if (!response) {
        res.status(403).json({
            message: "user doesn't exist"
        });
        return;
    }

    const check = await bcrypt.compare(password,response.password);

    if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment variables");
    }

    if(check){
        const token = jwt.sign(

        {id: response.id}, 
        JWT_SECRET,
        {expiresIn :'1h'}

        );

        res.json({
            token
        });
    }else{
        res.status(401).json({
            message: "incorrect credential"
        });
    };
})


userRouter.get('/user/me',authMiddleware, async (req,res) =>{

    const id = Number(req.id);
    const data = await client.user.findUnique({
        where:{
            id
        },

    });

    res.json({
        data
    })
})

// GET /api/v1/user/:userId === Fetch other users by ID.

// GET /api/v1/user/search?query= === Search users by name (for inviting to trips).

