import bcrypt from 'bcryptjs';
import redis from '../../../config/cache.js';
import { db } from '../../../config/database.js';
import { coupons, couponUsages } from '../../../db/schema/coupons.schema.js';
import { getUserWithProfileByEmail, getUserWithProfileById, updateUserWithProfile, createUserWithProfile, getUserById, updateUser } from '../../../dao/user.dao.js';

import { sendResponse, sendTokenResponse } from '../../../utils/response.utlis.js';
import { eq } from 'drizzle-orm';
import { 
    issueOtp, 
    verifyOtp, 
    resendOtp, 
    OTP_PURPOSES, 
    getOtpHtml, 
    getForgotPasswordOtpHtml, 
    normalizeEmail 
} from '../../../utils/otp.utils.js';


/**
 * Handle user registration request
 */
export async function register(req, res, next) {
    try {
        const { email, password, name, companyName, gstin, phone, couponCode } = req.body || {};
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const passwordValue = typeof password === 'string' ? password : '';
        const nameValue = typeof name === 'string' ? name.trim() : '';
        const companyNameValue = typeof companyName === 'string' ? companyName.trim() : '';
        const gstinValue = typeof gstin === 'string' ? gstin.trim() : '';
        const phoneValue = typeof phone === 'string' ? phone.trim() : '';
        const couponCodeValue = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : '';

        if (!normalizedEmail || !passwordValue || !companyNameValue || !gstinValue) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email, password, company name, and GSTIN are required.',
                success: false,
            });
        }

        const existingUser = await getUserWithProfileByEmail(normalizedEmail);
        if (existingUser) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is already registered',
                success: false,
            });
        }

        let coupon = null;
        if (couponCodeValue) {
            const [foundCoupon] = await db
                .select()
                .from(coupons)
                .where(eq(coupons.code, couponCodeValue));

            if (!foundCoupon) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    message: 'Invalid coupon code.',
                    success: false,
                });
            }

            if (!foundCoupon.isActive) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    message: 'Coupon is inactive.',
                    success: false,
                });
            }

            if (foundCoupon.expiresAt && new Date(foundCoupon.expiresAt) < new Date()) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    message: 'Coupon has expired.',
                    success: false,
                });
            }

            if (foundCoupon.usageLimit !== null && foundCoupon.usedCount >= foundCoupon.usageLimit) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    message: 'Coupon usage limit reached.',
                    success: false,
                });
            }

            coupon = foundCoupon;
        }

        const hashedPassword = await bcrypt.hash(passwordValue, 10);

        const otpResult = await issueOtp({
            email: normalizedEmail,
            purpose: OTP_PURPOSES.VERIFY_EMAIL,
            subject: 'Verification Email',
            buildHtml: getOtpHtml,
        });

        if (!otpResult.ok) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Unable to generate OTP.',
                success: false,
            });
        }

        const user = await db.transaction(async (tx) => {
            const createdUser = await createUserWithProfile(
                {
                    email: normalizedEmail,
                    password: hashedPassword,
                    name: nameValue || '',
                    role: 'CUSTOMER',
                    emailVerified: false,
                    isActive: true,
                    isDeleted: false,
                },
                {
                    phone: phoneValue || null,
                    companyName: companyNameValue,
                    gstin: gstinValue,
                    avatar: null,
                },
                tx
            );

            if (coupon) {
                await tx
                    .update(coupons)
                    .set({
                        usedCount: coupon.usedCount + 1,
                        updatedAt: new Date(),
                    })
                    .where(eq(coupons.id, coupon.id));

                await tx.insert(couponUsages).values({
                    couponId: coupon.id,
                    userId: createdUser.id,
                    usedAt: new Date(),
                });
            }

            return createdUser;
        });

        return sendTokenResponse(res, 201, 'User registered successfully', user);
    } catch (error) {
        next(error);
    }
}


/**
 * Handle user login request
 */
export async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email and password are required.',
                success: false,
            });
        }

        const user = await getUserWithProfileByEmail(email.trim().toLowerCase());
        if (!user) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Invalid email or password.',
                success: false,
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Invalid email or password.',
                success: false,
            });
        }

        return sendTokenResponse(res, 200, 'Login successful.', user);
    } catch (error) {
        next(error);
    }
}


/**
 * Handle user logout request
 */
export async function logout(req, res, next) {
    try {
        const token = req.token || req.cookies.token;
        if (!token) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Unauthorized. No token provided.',
                success: false,
            });
        }

        // Blacklist token in Redis for 24 hours (86400 seconds)
        await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60);

        res.clearCookie('token');

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Logout successful.',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify user's email address using OTP
 */
export async function verifyEmail(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

        if (!email || !otp) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Email and OTP are required',
            });
        }

        const verifyResult = await verifyOtp({
            email,
            otp,
            purpose: OTP_PURPOSES.VERIFY_EMAIL,
        });

        if (!verifyResult.ok) {
            if (verifyResult.reason === 'locked') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: 'Too many attempts. Please register again.',
                });
            }

            if (verifyResult.reason === 'expired') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'OTP expired',
                });
            }

            if (verifyResult.reason === 'invalid') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'Invalid OTP',
                    attemptsLeft: verifyResult.attemptsLeft,
                    cooldownRemaining: verifyResult.cooldownRemaining,
                });
            }

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'OTP expired or invalid',
            });
        }

        const user = await getUserByEmail(email);
        if (user) {
            await updateUser(user.id, { emailVerified: true, isActive: true });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Email verified successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Resend OTP code
 */
export async function resendOtpHandler(req, res, next) {
    try {
        const { email, purpose } = req.body || {};
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedPurpose = typeof purpose === 'string' ? purpose.trim() : '';
        const resolvedPurpose = normalizedPurpose || OTP_PURPOSES.VERIFY_EMAIL;

        if (!normalizedEmail) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Email is required',
            });
        }

        if (
            resolvedPurpose !== OTP_PURPOSES.VERIFY_EMAIL &&
            resolvedPurpose !== OTP_PURPOSES.FORGOT_PASSWORD
        ) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'Invalid OTP purpose',
            });
        }

        const otpConfig = resolvedPurpose === OTP_PURPOSES.FORGOT_PASSWORD
            ? {
                  subject: 'Reset your password',
                  buildHtml: getForgotPasswordOtpHtml,
                  missingMessage: 'Password reset session expired. Please request a new OTP.',
              }
            : {
                  subject: 'Resend Verification OTP',
                  buildHtml: getOtpHtml,
                  missingMessage: 'Verification session expired. Please register again.',
              };

        const resendResult = await resendOtp({
            email: normalizedEmail,
            purpose: resolvedPurpose,
            subject: otpConfig.subject,
            buildHtml: otpConfig.buildHtml,
        });

        if (!resendResult.ok) {
            if (resendResult.reason === 'cooldown') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: `Please wait ${resendResult.cooldownRemaining}s before requesting another OTP`,
                });
            }

            if (resendResult.reason === 'resend-limit') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: 'Maximum resend limit reached',
                });
            }

            if (resendResult.reason === 'expired') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: otpConfig.missingMessage,
                });
            }

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: otpConfig.missingMessage,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'OTP resent successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle password reset OTP request
 */
export async function forgotPassword(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);

        if (!email) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email is required.',
                success: false,
            });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 200,
                success: true,
                message: 'No valid account exists for this email',
            });
        }

        const otpResult = await issueOtp({
            email,
            purpose: OTP_PURPOSES.FORGOT_PASSWORD,
            subject: 'Reset your password',
            buildHtml: getForgotPasswordOtpHtml,
        });

        if (!otpResult.ok) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Unable to generate password reset OTP.',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'OTP sent to the registered email. Please check your inbox.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Handle password reset completion using OTP
 */
export async function resetPassword(req, res, next) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        const confirmPassword = typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : '';

        if (!email || !otp || !password || !confirmPassword) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email, OTP, password, and confirm password are required.',
                success: false,
            });
        }

        if (password !== confirmPassword) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Passwords do not match.',
                success: false,
            });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'No valid account exists for this email.',
            });
        }

        const verifyResult = await verifyOtp({
            email,
            otp,
            purpose: OTP_PURPOSES.FORGOT_PASSWORD,
        });

        if (!verifyResult.ok) {
            if (verifyResult.reason === 'locked') {
                return sendResponse({
                    res,
                    statusCode: 429,
                    success: false,
                    message: 'Too many attempts. Please request a new OTP.',
                });
            }

            if (verifyResult.reason === 'expired') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'OTP expired',
                });
            }

            if (verifyResult.reason === 'invalid') {
                return sendResponse({
                    res,
                    statusCode: 400,
                    success: false,
                    message: 'Invalid OTP',
                    attemptsLeft: verifyResult.attemptsLeft,
                    cooldownRemaining: verifyResult.cooldownRemaining,
                });
            }

            return sendResponse({
                res,
                statusCode: 400,
                success: false,
                message: 'OTP expired or invalid',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await updateUser(user.id, { password: hashedPassword });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Password reset successful.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current logged in user details
 */
export async function getMe(req, res, next) {
    try {
        const user = req.user;
        return sendResponse({
            res,
            statusCode: 200,
            message: 'User retrieved successfully',
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                phone: user.phone || null,
                companyName: user.companyName || null,
                gstin: user.gstin || null,
                avatar: user.avatar || null,
            },
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    phone: user.phone || null,
                    companyName: user.companyName || null,
                    gstin: user.gstin || null,
                    avatar: user.avatar || null,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Change current user password
 */
export async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await getUserById(userId);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'User not found.',
                success: false,
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Current password is incorrect.',
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updateUser(userId, { password: hashedPassword });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Password changed successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}

