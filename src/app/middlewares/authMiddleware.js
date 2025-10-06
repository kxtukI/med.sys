import jwt from "jsonwebtoken";
import { promisify } from 'util';
import { tokenBlacklist } from '../controllers/SessionsController.js';
import authConfig from '../../config/auth.js';

export default async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    const [, token] = authHeader.split(" ");

    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ error: "Token inválido" });
    }

    try {
        const decoded = await promisify(jwt.verify)(token, authConfig.secret);
        req.userId = decoded.id;
        return next();
    } catch (error) {
        return res.status(401).json({error: "Token inválido"});
    }
};