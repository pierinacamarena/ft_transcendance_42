
import { ChanMember, ChanMessage, Channel, User, ChanBan } from "@prisma/client";

export async function deleteChannel(chanId: number): Promise<void> {
    try {
      // delete related ChanMember records
      await this.prisma.chanMember.deleteMany({
        where: {
          chanId: chanId,
        },
      });
  
      // delete related ChanBan records
      await this.prisma.chanBan.deleteMany({
        where: {
          chanId: chanId,
        },
      });
  
      // delete related ChanMessage records
      await this.prisma.chanMessage.deleteMany({
        where: {
          chanId: chanId,
        },
      });
  
      // delete the Channel
      await this.prisma.channel.delete({
        where: {
          id: chanId,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
}
  