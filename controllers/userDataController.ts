import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { UserModelType } from '../models/user';
import { validateEmail } from './validators/profileUpdateValidators/validateEmail';
import { validateFirstName } from './validators/profileUpdateValidators/validateFirstName';
import { validateLastName } from './validators/profileUpdateValidators/validateLastName';
import { validatePassword } from './validators/profileUpdateValidators/validatePassword';
import bcrypt from 'bcrypt';
import { validateCurrentPassword } from './validators/passwordUpdateValidators/validateCurrentPassword';
import { validateNewPassword } from './validators/passwordUpdateValidators/validateNewPassword';
import { validateConfirmNewPassword } from './validators/passwordUpdateValidators/validateConfirmNewPassword';

const getUserData = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        const user = req.user as UserModelType;
        const id = user._id;

        try {
            const user = await User.findOne({ _id: id }, { password: 0 });
            if (!user) {
                return res
                    .status(404)
                    .json({ errors: [{ message: 'User not found' }] }); // Error handler expects an array of errors
            }

            return res.status(200).json({ user });
        } catch (err) {
            return next(err);
        }
    }
};

const updateUserData = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validatePassword(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        let userpic;

        if (req.file) {
            userpic = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }

        const reqUser = new User({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email,
            userpic,
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                message: 'Failed to update user!',
                errors: errors.array(),
                reqUser,
            });

            return;
        }

        if (req.user) {
            const user = req.user as UserModelType;
            const id = user._id;
            try {
                const updateData: any = {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                };
                if (userpic) {
                    updateData.userpic = userpic;
                }
                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    updateData,
                    { new: true }
                );
                res.status(200).json(updatedUser);
            } catch (err) {
                return next(err);
            }
        }
    },
];

const updateUserPassword = [
    validateCurrentPassword(),
    validateNewPassword(),
    validateConfirmNewPassword(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const reqUser = new User({
            password: req.body.new_password,
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                message: 'Failed to update user!',
                errors: errors.array(),
                reqUser,
            });

            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(reqUser.password, 10);
            reqUser.password = hashedPassword;

            if (req.user) {
                const user = req.user as UserModelType;
                const id = user._id;

                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    { password: hashedPassword },
                    { new: true }
                );

                res.status(200).json(updatedUser);
            }
        } catch (err) {
            return next(err);
        }
    },
];

export { getUserData, updateUserData, updateUserPassword };
