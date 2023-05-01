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
import { JwtUser } from '../types/jwtUser';
import { validateCoverImageName } from './validators/coverImageValidators/validateCoverImageName';

const getUserData = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        const reqUser = req.user as JwtUser;
        const id = reqUser._id;

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
            firstName: req.body.firstName,
            lastName: req.body.lastName,
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
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
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
            password: req.body.newPassword,
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

const updateCover = [
    validateCoverImageName(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const reqUser = new User({
            cover: req.body.coverImageName,
        });

        if (!errors.isEmpty()) {
            res.status(400).json({
                message: 'Failed to update cover!',
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
                    cover: req.body.coverImageName,
                };

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

export { getUserData, updateUserData, updateUserPassword, updateCover };
