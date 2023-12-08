import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService, Character } from "./user.service.js";
import { JwtGuard } from "../auth/guards/JwtGuard.js";
import { FriendRequest, User, Achievement } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from 'express';
import * as fs from 'fs';
import { diskStorage } from "multer";
import { FriendRequestService } from "../friend/friend.service.js";
import { promisify } from "util";

@Controller('users')
export class UserController {
    constructor(
        private userService: UserService,
        private friendRequestService: FriendRequestService,
    ) {}

    @Get('connected')
    @UseGuards(JwtGuard)
    IsConnected(@Req() req: any) {
        return this.userService.findOneByIdOrThrow(req.user.id);
    }

    @Get('all')
    @UseGuards(JwtGuard)
    async getAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Post('me/nickname')
    @UseGuards(JwtGuard)
    async changeNickname(@Req() req: any, @Body('nickname') nickname: string): Promise<User> {
        console.log('body:', req.body)
        console.log('name:', nickname)
        return this.userService.updateNickname(req.user.id, nickname);
    }

    @Post('me/story')
    @UseGuards(JwtGuard)
    async changeStory(@Req() req: any, @Body('story') story: string): Promise<User> {
        return this.userService.updateStory(req.user.id, story);
    }

	@Post('me/achievements/:id')
    @UseGuards(JwtGuard)
    async newAchievement(@Req() req: any, @Param('id', ParseIntPipe) achievId: number): Promise<Achievement> {
        if (achievId < 0 || achievId > 7) {
            throw new BadRequestException('the achievement ID must be between 0 and 7 included');
        }
        return this.userService.createAchievement(req.user.id, achievId);
    }

    @Post('me/avatar/upload')
    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                cb(null, 'upload/avatars');
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
                cb(null, file.fieldname + '-' + uniqueSuffix);
            },
        }),
        limits: {
            fieldSize: 2097152,
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'image/jpeg') {
                cb(null, true);
            }
            else {
                cb(null, false);
            }
        },
    })) 
    async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any): Promise<User> {
        if (!file) {
            throw new BadRequestException('can only upload jpeg files');
        }
        const user = await this.userService.findOneByIdOrThrow(req.user.id);
        const unlinkAsync = promisify(fs.unlink);
        if (user.avatarFilename !== 'default.jpg') {
            const path = 'upload/avatars/' + user.avatarFilename;
            try {
                await unlinkAsync(path);
                console.log(path + ' was deleted');
            } catch (err) {
                console.log('could not delete ' + path);
            }
        }
        return this.userService.updateAvatar(req.user.id, file.filename);
    }

    @Delete('me')
    @UseGuards(JwtGuard)
    async deleteOneUser(@Req() req: any) {
        return this.userService.deleteOneById(req.user.id);
    }

	@Get('self')
    @UseGuards(JwtGuard)
    async getSelf(@Req() req: any): Promise<User> {
        return this.userService.findOneById(req.user.id);
    }

    @Get('select/:name')    // change to POST
    @UseGuards(JwtGuard)
    async selectCharacter(@Req() req: any, @Param('name') character: Character): Promise<User> {
        return this.userService.updateSelected(req.user.id, character);
    }

    @Get(':id')
    @UseGuards(JwtGuard)
    async getOneById(@Param('id', ParseIntPipe) id: number): Promise<User> {
        return this.userService.findOneById(id);
    }

    @Get(':id/achievements')
    @UseGuards(JwtGuard)
    async getUserAchievements(@Param('id', ParseIntPipe) id: number): Promise<Achievement[]> {
        return this.userService.getAchievements(id)
    }

    @Get('rank/top/:count')
    @UseGuards(JwtGuard)
    async getTopPlayers(@Param('count', ParseIntPipe) count: number): Promise<User[]> {
        return this.userService.findManyByRankDec(count);
    }

    @Post('me/rank/:pts')
    @UseGuards(JwtGuard)
    async modifyRank(@Req() req: any, @Param('pts', ParseIntPipe) pts: number): Promise<User> {
        return this.userService.updateRank(req.user.id, pts);
    }

    @Get('me/friends')
    @UseGuards(JwtGuard)
    async getOwnFriendsIDs(@Req() req: any): Promise<number[]> {
        return this.friendRequestService.findAllFriends(req.user.id);
    }

    @Get('me/friends/requests/sent')
    @UseGuards(JwtGuard)
    async getFriendsRequestsSent(@Req() req: any): Promise<FriendRequest[]> {
        return this.friendRequestService.findAllRequestsSent(req.user.id);
    }

    @Get('me/friends/requests/received')
    @UseGuards(JwtGuard)
    async getFriendsRequestsReceived(@Req() req: any): Promise<FriendRequest[]> {
        return this.friendRequestService.findAllRequestsReceived(req.user.id);
    }

    @Post('me/friends/:id')
    @UseGuards(JwtGuard)
    async addFriend(@Req() req: any, @Param('id', ParseIntPipe) friendID: number): Promise<FriendRequest> {
        return this.friendRequestService.createOne(req.user.id, friendID);
    }

    @Delete('me/friends/:id')
    @UseGuards(JwtGuard)
    async deleteFriend(@Req() req: any, @Param('id', ParseIntPipe) friendID: number): Promise<FriendRequest> {
        return this.friendRequestService.deleteOne(req.user.id, friendID);
    }
}