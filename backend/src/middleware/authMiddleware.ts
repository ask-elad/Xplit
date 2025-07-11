import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;


export default function (req: Request, res: Response, next: NextFunction){

    const token = req.headers.authorization;

    if(!token){
        res.status(401).json({
            message: "invalid token or no header"
        });
        return
    }

    const decoded = jwt.verify(token, JWT_SECRET!)
    
    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded) {
        req.id = (decoded as { id: number }).id;
        next();
    } else {
        res.status(403).json({ error: "Unauthorized" });
    }
}