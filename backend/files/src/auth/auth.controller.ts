import { Controller, Get, UseGuards, Req, Post, Body, Res, UseFilters, UnauthorizedException, BadRequestException } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { Request, Response } from 'express';
import { FortyTwoAuthGuard } from './guards/FortyTwoGuard.js';
import { UserService } from '../user/user.service.js';
import { CallbackExceptionFilter } from './filter/callback-exception.filter.js';
import { JwtGuard } from './guards/JwtGuard.js';
import { User } from '@prisma/client';
import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';
import { JwtTwoFactorGuard } from './guards/JwtTwoFactorGuard.js';

@Controller('auth')
export class AuthController {
	private readonly hostIp = process.env.HOST_IP

    constructor(
        private authService: AuthService,
        private userService: UserService, // REMOVE
    ) {}

    @Get('42/login')
    @UseGuards(FortyTwoAuthGuard)
    handle42Loging() {}

    @Get('42/callback')
    @UseGuards(FortyTwoAuthGuard)
    @UseFilters(CallbackExceptionFilter)
    async handle42Redirect(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        const access_token = await this.authService.login(req.user, false);
        res.cookie('access_token', access_token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'lax',
        });
        res.redirect('http://' + this.hostIp + ':8080');
    }

    @Get('logout')
    @UseGuards(JwtGuard)
    logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): any {
		res.clearCookie('access_token', {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'lax',
        });
        //res.redirect('http://' + this.hostIp + ':8080');
        return (req.user);
    }

    @Post('2FA/on')
    @UseGuards(JwtGuard)
    async activate2FA(@Req() req: any): Promise<User> {
        const user: User = await this.userService.update2FAStatus(req.user.id, true);
        return user;
    }

    @Post('2FA/off')
    @UseGuards(JwtGuard)
    async deactivate2FA(@Req() req: any): Promise<User> {
        const user: User = await this.userService.update2FAStatus(req.user.id, false);
        return user;
    }

    @Post('2FA/secret/new')
    @UseGuards(JwtGuard)
    async addNewSecret(@Req() req: any): Promise<User> {
        const secret: string = authenticator.generateSecret();
        const user: User = await this.userService.update2FASecret(req.user.id, secret);
        return user
    }

    @Get('2FA/secret')
    @UseGuards(JwtGuard)
    async getSecretStatus(@Req() req: any): Promise<boolean> {
        const user: User = await this.userService.findOneFullById(req.user.id);
        if (user.twoFactorAuthSecret) {
            return true;
        }
        return false;
    }

    @Get('2FA/qrcode')
    @UseGuards(JwtGuard)
    async generateQRCode(@Req() req: any, @Res() res: any): Promise<any> {
        const user: User = await this.userService.findOneByIdOrThrow(req.user.id);
        if (!user.twoFactorAuthSecret) {
            throw new BadRequestException('generate a secret first');
        }
        const otpauthURL: string = authenticator.keyuri(user.email, 'transcendance', user.twoFactorAuthSecret);
        return toFileStream(res, otpauthURL);
    }

    @Post('2FA/verify')
    @UseGuards(JwtTwoFactorGuard)
    async verify2FACode(@Req() req: any, @Res({ passthrough: true }) res: Response, @Body('code') code: string): Promise<any> {
        const user: User = await this.userService.findOneByIdOrThrow(req.user.id);
        const isValid: boolean = authenticator.verify({
            token: code,
            secret: user.twoFactorAuthSecret,
        });
        if (!isValid) {
            throw new UnauthorizedException('wrong authenticator code');
        }
        const access_token = await this.authService.login(user, true);
        res.cookie('access_token', access_token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'lax',
        });
    }

}
