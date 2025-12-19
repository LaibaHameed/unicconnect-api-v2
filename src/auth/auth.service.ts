import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
// import { ProfilesService } from '../profiles/profiles.service';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        // private readonly profilesService: ProfilesService,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) { }

    private generateVerificationCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000);
        return String(code);
    };

    register = async (dto: RegisterDto): Promise<{ message: string }> => {
        try {
            const email = dto.email.toLowerCase().trim();
            const existing = await this.usersService.findByEmail(email);

            const hashed = await bcrypt.hash(dto.password, 10);
            const code = this.generateVerificationCode();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            // ✅ Case: user already exists
            if (existing) {
                // Already verified → block duplicate registration
                if (existing.emailVerified) {
                    throw new ConflictException('Email already registered');
                }

                // Unverified → refresh password + verification code
                await this.usersService.updateByEmail(email, {
                    password: hashed,
                    verificationCode: code,
                    verificationExpiresAt: expiresAt,
                });

                await this.mailService.sendVerificationEmail(email, code);

                return {
                    message:
                        'Account already exists but is not verified. A new verification code has been sent to your email.',
                };
            }

            // ✅ Case: new user (NO profile creation here)
            await this.usersService.createUser({
                email,
                password: hashed,
                verificationCode: code,
                verificationExpiresAt: expiresAt,
                emailVerified: false,
                profileCompleted: false,
                isActive: true,
            });

            await this.mailService.sendVerificationEmail(email, code);

            return { message: 'Registered. Verification code sent to email.' };
        } catch (error) {
            console.error('Error in register:', error);
            throw error;
        }
    };


    verifyEmail = async (dto: VerifyEmailDto): Promise<{ message: string }> => {
        try {
            const email = dto.email.toLowerCase().trim();
            const user = await this.usersService.findByEmail(email);

            if (!user) throw new BadRequestException('Invalid email or code');

            if (!user.verificationCode || !user.verificationExpiresAt) {
                throw new BadRequestException('No verification request found');
            }

            if (user.verificationExpiresAt < new Date()) {
                throw new BadRequestException('Verification code expired');
            }

            if (user.verificationCode !== dto.code) {
                throw new BadRequestException('Invalid verification code');
            }

            await this.usersService.updateByEmail(email, {
                emailVerified: true,
                verificationCode: undefined,
                verificationExpiresAt: undefined,
            });


            return { message: 'Email verified successfully.' };
        } catch (error) {
            console.error('Error in verifyEmail:', error);
            throw error;
        }
    };

    resendVerification = async (email: string): Promise<{ message: string }> => {
        try {
            const user = await this.usersService.findByEmail(email);

            if (!user) throw new BadRequestException('No account found with this email');
            if (user.emailVerified) throw new BadRequestException('Email is already verified');

            const code = this.generateVerificationCode();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await this.usersService.updateByEmail(email, {
                verificationCode: code,
                verificationExpiresAt: expiresAt,
            });

            await this.mailService.sendVerificationEmail(email, code);

            return { message: 'New verification code sent to your email.' };
        } catch (error) {
            console.error('Error in resendVerification:', error);
            throw error;
        }
    };

    login = async (
        dto: LoginDto,
    ): Promise<{
        accessToken: string;
        profileCompleted: boolean;
        user: { id: string; email: string; role: string };
    }> => {
        try {
            const email = dto.email.toLowerCase().trim();
            const user = await this.usersService.findByEmail(email);

            if (!user) throw new UnauthorizedException('Invalid credentials');
            if (!user.emailVerified) throw new UnauthorizedException('Email not verified');

            const isMatch = await bcrypt.compare(dto.password, user.password);
            if (!isMatch) throw new UnauthorizedException('Invalid credentials');

            const accessToken = await this.jwtService.signAsync({
                sub: user._id.toString(),
                email: user.email,
            });

            return {
                accessToken,
                profileCompleted: user.profileCompleted,
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                },
            };
        } catch (error) {
            console.error('Error in login:', error);
            throw error;
        }
    };

    forgotPassword = async (email: string): Promise<{ message: string }> => {
        try {
            const user = await this.usersService.findByEmail(email);

            // do not leak existence
            if (!user) {
                return {
                    message:
                        'If an account exists for this email, a password reset code has been sent.',
                };
            }

            const code = this.generateVerificationCode();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await this.usersService.updateByEmail(email, {
                passwordResetCode: code,
                passwordResetExpiresAt: expiresAt,
            });

            await this.mailService.sendPasswordResetEmail(email, code);

            return {
                message:
                    'If an account exists for this email, a password reset code has been sent.',
            };
        } catch (error) {
            console.error('Error in forgotPassword:', error);
            throw error;
        }
    };

    resetPassword = async (dto: {
        email: string;
        code: string;
        newPassword: string;
    }): Promise<{ message: string }> => {
        try {
            const email = dto.email.toLowerCase().trim();
            const user = await this.usersService.findByEmail(email);

            if (!user || !user.passwordResetCode || !user.passwordResetExpiresAt) {
                throw new BadRequestException('Invalid reset request');
            }

            if (user.passwordResetExpiresAt < new Date()) {
                throw new BadRequestException('Reset code expired');
            }

            if (user.passwordResetCode !== dto.code) {
                throw new BadRequestException('Invalid reset code');
            }

            const hashed = await bcrypt.hash(dto.newPassword, 10);

            await this.usersService.updateByEmail(email, {
                password: hashed,
                passwordResetCode: undefined,
                passwordResetExpiresAt: undefined,
            });

            return { message: 'Password reset successfully.' };
        } catch (error) {
            console.error('Error in resetPassword:', error);
            throw error;
        }
    };

}
