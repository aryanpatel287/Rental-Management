import bcrypt from 'bcryptjs';
import {
    createUser,
    getUserByEmail,
    updateUserPassword,
    markEmailAsVerified,
    markUserAsActive,
} from '../services/user.service.js';
import { sendResponse } from '../utils/response.utlis.js';
import jwt from 'jsonwebtoken';
import envConfig from '../config/envConfig.js';
import {
    getForgotPasswordOtpHtml,
    getOtpHtml,
    issueOtp,
    normalizeEmail,
    OTP_PURPOSES,
    resendOtp,
    verifyOtp,
} from '../utils/otp.utils.js';
import redis from '../config/cache.js';

/**
 * Helper function to generate JWT token, set cookie, and send response
 */
async function sendTokenResponse({ res, user, message }) {
    const token = jwt.sign(
        { id: user.id, email: user.email },
        envConfig.JWT_SECRET,
        {
            expiresIn: '1d',
        },
    );

    res.cookie('token', token);

    return sendResponse({
        res,
        statusCode: 200,
        message: message,
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
        },
    });
}

/**
 * @route POST /api/auth/register
 * @description Register a user
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { email, password, name } = req.body || {};
        const normalizedEmail =
            typeof email === 'string' ? email.trim().toLowerCase() : '';
        const passwordValue = typeof password === 'string' ? password : '';
        const nameValue = typeof name === 'string' ? name.trim() : null;

        if (!normalizedEmail || !passwordValue) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email and password are required.',
                success: false,
            });
        }

        const existingUser = await getUserByEmail(normalizedEmail);
        if (existingUser) {
            return sendResponse({
                res,
                statusCode: 409,
                message: 'Email already in use.',
                success: false,
            });
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

        const user = await createUser({
            email: normalizedEmail,
            password: hashedPassword,
            name: nameValue || undefined,
        });

        return sendTokenResponse({
            res,
            user,
            message: 'User registered successfully.',
        });
    } catch (error) {
        console.error('Error registering user: ', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Failed to register user.',
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * @route POST /api/auth/login
 * @description Login a user
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Email and password are required.',
                success: false,
            });
        }

        const user = await getUserByEmail(email.trim().toLowerCase());
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

        return sendTokenResponse({
            res,
            user,
            message: 'Login successful.',
        });
    } catch (error) {
        console.error('Error logging in user: ', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Failed to login user.',
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * @route POST /api/auth/forgot-password
 * @description Request a password reset OTP
 * @access Public
 */
async function forgotPasswordController(req, res) {
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

        const existingUser = await getUserByEmail(email);
        if (!existingUser) {
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
            message:
                'OTP sent to the registered email. Please check your inbox.',
        });
    } catch (error) {
        console.error('Error requesting forgot password OTP: ', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Failed to send password reset OTP.',
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * @route POST /api/auth/reset-password
 * @description Reset password using OTP
 * @access Public
 */
async function resetPasswordController(req, res) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp =
            typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
        const password =
            typeof req.body?.password === 'string' ? req.body.password : '';
        const confirmPassword =
            typeof req.body?.confirmPassword === 'string'
                ? req.body.confirmPassword
                : '';

        if (!email || !otp || !password || !confirmPassword) {
            return sendResponse({
                res,
                statusCode: 400,
                message:
                    'Email, OTP, password, and confirm password are required.',
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

        const existingUser = await getUserByEmail(email);
        if (!existingUser) {
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
        await updateUserPassword({
            userId: existingUser.id,
            newPassword: hashedPassword,
        });

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Password reset successful.',
        });
    } catch (error) {
        console.error('Error resetting password: ', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Failed to reset password.',
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * @route POST /api/auth/logout
 * @description Logout a user
 * @access Private
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token;
    if (!token) {
        return sendResponse({
            res,
            statusCode: 401,
            message: 'Unauthorized. No token provided.',
            success: false,
        });
    }

    await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60); // TTL: 1day

    res.clearCookie('token');
    return sendResponse({
        res,
        statusCode: 200,
        message: 'Logout successful.',
        success: true,
    });
}

/**
 * @route GET /api/auth/get-me
 * @description Get current user profile
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return sendResponse({
                res,
                statusCode: 401,
                message: 'Unauthorized. No token provided.',
                success: false,
            });
        }

        const decoded = jwt.verify(token, envConfig.JWT_SECRET);
        const user = await getUserByEmail(decoded.email);
        if (!user) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'User not found.',
                success: false,
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User profile fetched successfully.',
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Error fetching user profile: ', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Failed to fetch user profile.',
            success: false,
            error: 'Internal server error',
        });
    }
}

/**
 * @route POST /api/auth/verify-user
 * @description Verification of user based on OTP
 * @access Public
 */
async function verifyEmailController(req, res) {
    try {
        const email = normalizeEmail(req.body?.email);
        const otp =
            typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

        // Validation
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

        await markEmailAsVerified(email);
        await markUserAsActive(email);

        return sendResponse({
            res,
            statusCode: 200,
            success: true,
            message: 'Email verified successfully',
        });
    } catch (error) {
        console.log('Verify Email Error:', error);

        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Internal server error',
        });
    }
}

/**
 * @route POST /api/auth/resend-otp
 * @description Resend OTP for email verification
 * @access Public
 */
async function resendOtpController(req, res) {
    try {
        const { email, purpose } = req.body || {};

        const normalizedEmail =
            typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedPurpose =
            typeof purpose === 'string' ? purpose.trim() : '';

        const resolvedPurpose = normalizedPurpose || OTP_PURPOSES.VERIFY_EMAIL;

        // Validation
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

        const otpConfig =
            resolvedPurpose === OTP_PURPOSES.FORGOT_PASSWORD
                ? {
                      subject: 'Reset your password',
                      buildHtml: getForgotPasswordOtpHtml,
                      missingMessage:
                          'Password reset session expired. Please request a new OTP.',
                  }
                : {
                      subject: 'Resend Verification OTP',
                      buildHtml: getOtpHtml,
                      missingMessage:
                          'Verification session expired. Please register again.',
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
        console.log('Resend OTP Error:', error);

        return sendResponse({
            res,
            statusCode: 500,
            success: false,
            message: 'Internal server error',
        });
    }
}

export {
    registerUserController,
    loginUserController,
    forgotPasswordController,
    resendOtpController,
    logoutUserController,
    getMeController,
    verifyEmailController,
    resetPasswordController,
};
