import { Router } from 'express';
import { adminLogin } from '../controllers/adminController';

export const adminRoute = Router();

adminRoute.post('/admin/login', adminLogin);
