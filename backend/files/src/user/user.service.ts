import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma, User, Achievement } from '@prisma/client';

export type Character = 'Boreas' | 'Helios' | 'Selene' | 'Liliana' | 'Orion' | 'Faeleen' | 'Rylan' | 'Garrick' | 'Thorian'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async findOneById(id: number): Promise<User | null> {
    const user: User | null = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }

  async findOneFullById(id: number): Promise<User | null> {
    const user: User | null = await this.prisma.user.findUnique({
      where: { id },
    });
    return user;
  }

  async findOneByIdOrThrow(id: number): Promise<User | null> {
    const user: User = await this.prisma.user.findUniqueOrThrow({
      where: { id },
    });
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user: User | null = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  async findOrCreateOne42(email: string, nickname: string): Promise<User> {

    let user: User = await this.findOneByEmail(email);
    if (user) {
      return user;
    }

    user = await this.createOne({
      email,
      nickname,
    });

    return user;
  }



  async findOrCreateOne(email: string): Promise<User> {

    let user: User = await this.findOneByEmail(email);
    if (user) {
      return user;
    }

    const nickname = this.generateFunnyNickname();
    user = await this.createOne({
      email,
      nickname,
    });

    return user;
  }

  async findAll(): Promise<User[] | null> {
    const users: User[] = await this.prisma.user.findMany({});
    return users;
  }

  async findManyByRankDec(count: number): Promise<User[]> {
    const users: User[] = await this.prisma.user.findMany({
      orderBy: {
        rankPoints: "desc",
      },
      take: count,
    });
    return users;
  }

  async createOne(userCreateInput: Prisma.UserCreateInput): Promise<User> {
    const user: User = await this.prisma.user.create({
      data: userCreateInput,
    });
    return user;
  }

  async deleteOneById(id: number): Promise<User> {
    const user: User = await this.prisma.user.delete({
      where: { id },
    });
    return user;
  }

  async updateNickname(id: number, nickname: string): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: { id },
      data: {
        nickname,
      },
    });
    return user;
  }

  async updateStory(id: number, story: string): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: { id },
      data: {
        story,
      },
    });
    return user;
  }

  async updateAvatar(id: number, filename: string): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: { id },
      data: {
        avatarFilename: filename,
      },
    });
    return user;
  }

  async updateRank(id: number, pts: number): Promise<User> {
    const user: User = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    let sameUser: User
    if (pts > 0 || (pts < 0 && user.rankPoints >= pts * -1)) {
      sameUser = await this.prisma.user.update({
        where: { id },
        data: { rankPoints: { increment: pts } },
      });
    }
    else {
      sameUser = await this.prisma.user.update({
        where: { id },
        data: { rankPoints: 0 },
      });
    }
    return sameUser;
  }

  async updateSelected(id: number, character: Character): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: {
        id
      },
      data: {
        character: character
      },
    });
    return user;
  }

  async update2FAStatus(id: number, status: boolean): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        twoFactorAuthStatus: status,
      },
    });
    return user;
  }

  async update2FASecret(id: number, secret: string): Promise<User> {
    const user: User = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        twoFactorAuthSecret: secret,
      },
    });
    return user;
  }

  async createAchievement(userId: number, achievId: number): Promise<Achievement> {
    // First, try to find the achievement in the database
    let achievement = await this.prisma.achievement.findUnique({
      where: {
        userId_achievId: {
          userId: userId,
          achievId: achievId,
        },
      },
    });
    // If the achievement doesn't exist, create a new one
    if (!achievement) {
      achievement = await this.prisma.achievement.create({
        data: {
          userId,
          achievId,
        },
      });
    }
    return achievement;
  }

  async getAchievements(userId: number): Promise<Achievement[]> {
    const achievements: Achievement[] = await this.prisma.achievement.findMany({
      where: {
        userId: userId
      },
    });
    return achievements;
  }

  generateFunnyNickname(): string {
    const adjectives: string[] = ['happy', 'silly', 'goofy', 'wacky', 'zany', 'quirky', 'bouncy', 'spunky', 'jolly', 'nutty'];
    const nouns: string[] = ['banana', 'muffin', 'pickle', 'noodle', 'butterfly', 'cupcake', 'dinosaur', 'penguin', 'unicorn', 'octopus'];
    const randomAdjective: string = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun: string = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum: number = Math.floor(Math.random() * 100);
    return `${randomAdjective}-${randomNoun}-${randomNum}`;
  }

}