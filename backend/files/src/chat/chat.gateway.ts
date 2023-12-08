import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException
} from '@nestjs/websockets';  
import { Socket, Server } from "socket.io";
import { ChanType, User } from '@prisma/client';
import { ChatService } from './service/index.js';
import { UserService } from '../user/user.service.js'
import { Logger } from '@nestjs/common';
import { UserSocketsService } from './chat.userSocketsService.js';
import * as bcrypt from 'bcrypt';
import { players, socketService } from '../main.js';

type friendState = 'offline' | 'online' | 'in game'

@WebSocketGateway({cors:
  {
    origin: '*',
    methods: ['GET', 'POST']
  }
  , namespace: 'chat'})

export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
 {
  constructor(
    private readonly chatService: ChatService,
    private readonly userSocketsService: UserSocketsService,
    private readonly userService: UserService,
    ){}

  private logger: Logger = new Logger('ChatGateway');
  @WebSocketServer()
  server: Server;


  //*****************************************************************************************************************************************//
  //*****************************************************************************************************************************************//
  //                                                        PRIV MESSAGE EVENTS                                                              //
  //*****************************************************************************************************************************************//
  //*****************************************************************************************************************************************//

  //GET ALL MESSAGES OF A CONVERSATION

  @SubscribeMessage('getPrivateConversation')
  async handleGetPrivateConversation(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: {firstUser: number; secondUser: number}) : Promise<void>
  {
    try {
      const { firstUser, secondUser} = data;
      const isBlocked = await this.chatService.isBlocked(firstUser,secondUser);
      const hasBlocked = await this.chatService.hasBlocked(secondUser, firstUser);
      const firstUserChatRoom = 'userID_' + firstUser.toString() + '_room';
      const secondUserChatRoom = 'userID_' + secondUser.toString() + '_room';
      if (isBlocked || hasBlocked ){
        this.server.to(firstUserChatRoom).to(secondUserChatRoom).emit('foundPrivateConversation', []);
        return;
      }
      const conversation = await this.chatService.getPrivateConversation(firstUser, secondUser);
      // console.log("conversation:", conversation); // Add this line
      this.server.to(firstUserChatRoom).to(secondUserChatRoom).emit('foundPrivateConversation', conversation);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not get private conversation');
    }
  }

  //SEND A MESSAGE

  @SubscribeMessage('getBlockStatus')
  async handleContactBlocked(
      @ConnectedSocket() client: Socket, 
      @MessageBody() data: {userId: number; contactId: number}) : Promise<void>
  {
      try {
          const { userId, contactId} = data;
          const isBlocked = await this.chatService.isBlocked(userId, contactId);
          const hasBlocked = await this.chatService.hasBlocked(contactId, userId);
          const userChatRoom = 'userID_' + userId.toString() + '_room';
          if (hasBlocked || isBlocked) {
            this.server.to(userChatRoom).emit('foundBlockStatus', true);
          }
          else {
            this.server.to(userChatRoom).emit('foundBlockStatus', false);

          }
      } catch (error) {
          console.log(error);
          throw new WsException(error.message || 'Could not create private message');
      }
  }


  @SubscribeMessage('createPrivateMessage')
  async handleCreateMessage(
      @ConnectedSocket() client: Socket, 
      @MessageBody() data: {senderID: number; recipientID: number; content: string}) : Promise<void>
  {
      try {
          const { senderID, recipientID, content} = data;
          const isBlocked = await this.chatService.isBlocked(recipientID, senderID);
          const hasBlocked = await this.chatService.hasBlocked(senderID, recipientID);
          if (isBlocked) {
            throw new WsException('Could not create message user is blocked');
          }
          if (hasBlocked) {
            throw new WsException('Could not create you blocked this user');
          }
          // console.log("CREATING MESSAGE BECAUSE USER IS NOT BLOCKED");
          const privateMessage = await this.chatService.createOnePrivMessage(senderID, recipientID, content);
          const senderUserChatRoom = 'userID_' + senderID.toString() + '_room';
          const recipientUserChatRoom = 'userID_' + recipientID.toString() + '_room';
          this.server.to(senderUserChatRoom).to(recipientUserChatRoom).emit('privateMessageCreated', privateMessage);
      } catch (error) {
          console.log(error);
          throw new WsException(error.message || 'Could not create private message');
      }
  }
  

  @SubscribeMessage('sendPrivateMessage')
  async handleSendPrivateMessage(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: {senderID: number; recipientID: number; content: string}) : Promise<void>
  {
    try {
      const { senderID, recipientID, content} = data;
      const isBlocked = await this.chatService.isBlocked(recipientID, senderID);
      const hasBlocked = await this.chatService.hasBlocked(senderID, recipientID);
      // console.log("isBlocked: ", isBlocked);
      if (isBlocked || hasBlocked)
      {
        // console.log("IT IS BLOCKED");
        const senderUserChatRoom = 'userID_' + senderID.toString() + '_room';
        this.server.to(senderUserChatRoom).emit('privateMessageSent', data);
      }
      else if (!isBlocked && !hasBlocked){
        // console.log("IT IS NOT BLOCKED");
        const senderUserChatRoom = 'userID_' + senderID.toString() + '_room';
        const recipientUserChatRoom = 'userID_' + recipientID.toString() + '_room';
        this.server.to(senderUserChatRoom).to(recipientUserChatRoom).emit('privateMessageSent', data);
      }
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not send private message');
    }
  }


  @SubscribeMessage('userIsBlocked')
  async handleUserIsBlocked(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: {blockerID: number; blockeeID: number}) : Promise<void>
  {
    try {
      const { blockerID, blockeeID} = data;
      const isBlocked = await this.chatService.isBlocked(blockerID, blockeeID);
      const userRoomId = 'userID_' + blockerID.toString() + '_room';
      if (isBlocked) {
        // console.log("USER IS BLOCKED:", isBlocked);
        this.server.to(userRoomId).emit('blockInfo', true);
      }
      else {
        // console.log("USER IS NOT BLOCKED:", isBlocked);
        this.server.to(userRoomId).emit('blockInfo', false);
      }
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'could not find out if user is blocked');
    }
  }


  //BLOCK

  @SubscribeMessage('blockUser')
  async handleBlockUser(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: {blockerID: number; blockeeID: number}) : Promise<void>
  {
    try {
      const { blockerID, blockeeID} = data;
      const blockeEntity = await this.chatService.blockUser(blockerID, blockeeID);
      const userRoomId = 'userID_' + blockerID.toString() + '_room';
      this.server.to(userRoomId).emit('userBlocked');
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not block user');
    }
  }

  //UNBLOCK

  @SubscribeMessage('unblockUser')
  async handleUnblockUser(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: {blockerID: number; blockeeID: number}) : Promise<void>
  {
    try {
      const { blockerID, blockeeID} = data;
      await this.chatService.unblockUser(blockerID, blockeeID);
      const userRoomId = 'userID_' + blockerID.toString() + '_room';
      this.server.to(userRoomId).emit('userUnblocked');
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not unblock user');
    }
  }


  //*****************************************************************************************************************************************//
  //*****************************************************************************************************************************************//
  //                                                          CHANNEL EVENTS                                                                 //
  //*****************************************************************************************************************************************//
  //*****************************************************************************************************************************************//


  //--------------------------------------------------------------------------//
  //                            CHANNEL SETUP EVENTS                          //
  //--------------------------------------------------------------------------//

  /**
   * 'createChannel' event that creates a channel on the db
   * and emits to the client an event 'channelCreated' with the created channel
   * @param client 
   * @param data 
   */

  @SubscribeMessage('createChannel')
  async onCreateChannel(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: {name: string; userId: number, type: string, psswd?: string}) : Promise<void>
  {
    try {
      const { name, userId, type, psswd } = data;
  
      const userRoomId = 'userID_' + userId.toString() + '_room';
      const channel = await this.chatService.createOneChannel(name, userId);
      if (!channel) {
        console.log('MEOOOOW')
        this.server.to(userRoomId).emit('failedToCreateChannel', channel.name);
        return;
      }
      const chanID = channel.id;
      await this.chatService.createOneChanMember(chanID, userId);
      await this.chatService.makeOwnerAdmin(userId, chanID);
      if (!Object.values(ChanType).includes(type as ChanType)){
        throw new WsException('Invalid channel type');
      }
      await this.chatService.setChannelType(userId, chanID, ChanType[type as keyof typeof ChanType]);
      if (type == 'PROTECTED') {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(psswd, saltRounds);
        await this.chatService.setChanPassword(chanID, userId, hashedPassword);
      }
      const userSockets = this.userSocketsService.getUserSocketIds(userId);
      for (const socket of userSockets) {
        if (socket){
          const ChanRoomId = 'chan_'+ chanID + '_room';
          socket.join(ChanRoomId);
        }
      }
      this.server.emit('channelCreated', channel);
      this.server.to(userRoomId).emit('joinnedRoom', channel.name);
    }
    catch (error)
    {
      console.log(error);
      throw new WsException(error.message || 'Could not create channel');
    }
  }


  //--------------------------------------------------------------------------//
  //                         CHANNEL RETRIEVE EVENTS                          //
  //--------------------------------------------------------------------------//

  /**
   * Event to find a channel by id and emit it to the client
   * as 'channelFound'
   * @param client 
   * @param data 
   */
  @SubscribeMessage('GetChannel')
  async handleGetChannel(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number}) : Promise<void>
  {
    try{
      const channel = await this.chatService.findChannelbyId(data.chanId);
      client.emit('channelFound', channel);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could find channel');
    }
  }

  @SubscribeMessage('GetUserChansMember')
  async handleGetUserChansMember(
      @ConnectedSocket() client: Socket,
      @MessageBody() userId: number) : Promise<void>
  {
    try{
      const channels = await this.chatService.findAllChannelsByMember(userId);
      // console.log("channels:", channels);
      const userRoomId = 'userID_' + userId.toString() + '_room';
      this.server.to(userRoomId).emit('UserChansMemberFound', channels);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not get user`s channels');
    }
  }

  @SubscribeMessage('GetChannelsByUser')
  async handleGetChannelbyUser(
      @ConnectedSocket() client: Socket,
      @MessageBody() userId: number) : Promise<void>
  {
    try{
      const channels = await this.chatService.findAllChannelsByUserId(userId);
      // console.log("channels:", channels);
      const userRoomId = 'userID_' + userId.toString() + '_room';
      this.server.to(userRoomId).emit('channelsByUserFound', channels);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not get user`s channels');
    }
  }

  @SubscribeMessage('GetNotJoinedChannels')
  async handleGetChannelsUserNonMember(
      @ConnectedSocket() client: Socket,
      @MessageBody() userId: number) : Promise<void>
  {
    try{
      const channels = await this.chatService.findAllChannelsNonMember(userId);
      // console.log("channels:", channels);
      const userRoomId = 'userID_' + userId.toString() + '_room';
      this.server.to(userRoomId).emit('notJoinedChannelsFound', channels);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not get channels user is not member');
    }
  }

  @SubscribeMessage('GetChannelMembers')
  async handleChannelMembers(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, userId: number}) : Promise<void>
  {
    try{
      const {chanId, userId} = data;
      const members = await this.chatService.findAllMembersByChanID(chanId);
      const userRoomId = 'userID_' + userId.toString() + '_room';
      this.server.to(userRoomId).emit('MembersofChannelFound', members);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not get channel members');
    }
  }

  @SubscribeMessage('GetPublicChannels')
  async handleGetPublicChannels(
    @ConnectedSocket() client: Socket) : Promise<void> {
      try {
        const channels = await this.chatService.findAllPublicChannels();
        this.server.emit('publicChannelsfound', channels);
      }
      catch (error) {
        console.log(error);
        throw new WsException(error.message || 'Could not get public channels');
      }
  }

  @SubscribeMessage('GetProtectedChannels')
  async handleGetProtectedChannels(
  @ConnectedSocket() client: Socket) : Promise<void> {
    try {
      const channels = await this.chatService.findAllProtectedChannels();
      this.server.emit('protectedChannelsfound', channels);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not get protected channels');
    }
  }

  @SubscribeMessage('GetChanNonMembers')
  async handleGetChanNonMembers(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, userId: number}) : Promise<void>
  {
    try{
      const {chanId, userId} = data;
      const nonMembers = await this.chatService.findAllNonMembersByChanId(chanId);
      const userRoomId = 'userID_' + userId.toString() + '_room';
      this.server.to(userRoomId).emit('chanNonMembersFound', nonMembers);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not get channel members');
    }
  }

  //--------------------------------------------------------------------------//
  //                           CHANNEL MESSAGE EVENTS                         //
  //--------------------------------------------------------------------------//

  //to test the difference between the client.emit and the server.emit 
  /**
   * sendChanMessageEvent will create a message for the required channel
   * and emit a 'sentChanMessage' back to the client with the chanMessage as data
   * @param client 
   * @param data 
   */
  @SubscribeMessage('sendChanMessage')
  async handleSendChanMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {senderId: number; senderNick: string; chanId: number; content: string}) : Promise<void>
  {
    // console.log("entering sendChanMessage");
    try {
      const {senderId, senderNick, chanId, content} = data;
      const isMember = await this.chatService.isMember(chanId, senderId);
      if (!isMember) {
        const userRoomId = 'userID_' + senderId.toString() + '_room';
        this.server.to(userRoomId).emit('userIsNotMember');
        throw new WsException('user not in channel');
      }
      const isMuted = await this.chatService.isMuted(chanId, senderId);
      if (isMuted){
        const userRoomId = 'userID_' + senderId.toString() + '_room';
        this.server.to(userRoomId).emit('userIsMuted');
        throw new WsException('user is muted');
      }
      const chanMessage = await this.chatService.createOneChanMessage(senderId, senderNick, chanId, content);
      const ChanRoomId = 'chan_'+ chanId + '_room';
      // console.log('chanMessage: ', chanMessage);

      this.server.to(ChanRoomId).emit('SentChanMessage', chanMessage);
    }
    catch (error)
    {
      console.log(error);
      throw new WsException(error.message || 'Could not send message to channel');
    }
  }

  @SubscribeMessage('GetChannelMessages')
  async handleGetChannelMessages(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, userId: number}) : Promise<void>
  {
    try{
      // console.log("getallChannelMessages backend socket event");
      const {chanId, userId} = data;
      // console.log("chanID:", chanId);
      const isMember = await this.chatService.isMember(chanId, userId);
      if (!isMember) {
        const userRoomId = 'userID_' + userId.toString() + '_room';
        this.server.to(userRoomId).emit('userIsMuted');
        throw new WsException('user not in channel');
      }
      const messages = await this.chatService.findAllChanMessages(chanId);
      const userData = await this.chatService.getUserFromSocket(client);
      const userRoomId = 'userID_' + userData.id.toString() + '_room';
      this.server.to(userRoomId).emit('channelMessagesFound', {messages: messages, chanId: chanId});;
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not channel messages');
    }
  }

  //--------------------------------------------------------------------------//
  //                           CHANNEL MEMBER EVENTS                          //
  //--------------------------------------------------------------------------//





  /**
   * JoinChannel event, will make the giver user join the givne channel
   * and emit an event 'userJoinedChannel' 
   * @param client 
   * @param data 
   */

  //check user has not been banned
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanID: number, userID: number}) : Promise<void>
  {
    try {
      const {chanID, userID} = data;
      console.log("join public channel");
      const userRoomId = 'userID_' + userID.toString() + '_room';
      const channel = await this.chatService.findChannelbyId(chanID);
      const isBanned = await this.chatService.isBanned(chanID, userID);
      if (isBanned) {
        this.server.to(userRoomId).emit('userIsBanned', channel.name);        
        throw new WsException('Chan member is banned');
      }
      await this.chatService.createOneChanMember(chanID, userID);
      const userSockets = this.userSocketsService.getUserSocketIds(userID);
      for (const socket of userSockets) {
        if (socket){
          const ChanRoomId = 'chan_'+ chanID + '_room';
          socket.join(ChanRoomId);
        }
      }
      this.server.to(userRoomId).emit('joinnedRoom', channel.name);
      const user = await this.userService.findOneById(userID);
      const ChanRoomId = 'chan_'+ chanID + '_room';
      const content = 'I just joined the channel 😸';
      const joinMessage = await this.chatService.createOneChanMessage(userID, user.nickname, chanID, content);
      this.server.to(ChanRoomId).emit('userJoinnedRoom');
      this.server.to(ChanRoomId).emit('SentChanMessage', joinMessage);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not public or private channel');
    }
  }

  @SubscribeMessage('joinProtectedChannel')
  async handleJoinProtectedChannel(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanID: number, userID: number, password: string}) : Promise<void>
  {
    try {
      console.log('joining protected channel');
      const {chanID, userID, password} = data;
      const isBanned = await this.chatService.isBanned(chanID, userID);
      const userRoomId = 'userID_' + userID.toString() + '_room';
      const channel = await this.chatService.findChannelbyId(chanID);
      if (isBanned) {
        this.server.to(userRoomId).emit('userIsBanned', channel.name);
        return;
      }
      const passwordMatches = await this.chatService.psswdMatch(chanID, password);
      if (!passwordMatches) {
        this.server.to(userRoomId).emit('wrongPassword', channel.name);
        throw new WsException('password does not match');
      }
      console.log('passed passwd matches');
      const chanMember = await this.chatService.createOneChanMember(chanID, userID);
      const userSockets = this.userSocketsService.getUserSocketIds(userID);
      for (const socket of userSockets) {
        if (socket){
          const ChanRoomId = 'chan_'+ chanID + '_room';
          socket.join(ChanRoomId);
        }
      }
      this.server.to(userRoomId).emit('joinnedProtectedChannel', channel.name);
      const user = await this.userService.findOneById(userID);
      const ChanRoomId = 'chan_'+ chanID + '_room';
      const content = 'I just joined the channel 😸';
      const joinMessage = await this.chatService.createOneChanMessage(userID, user.nickname, chanID, content);
      this.server.to(ChanRoomId).emit('SentChanMessage', joinMessage);
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not join protected channel');
    }
  }

  @SubscribeMessage('addUsersToChannel')
  async handleAddUsersToChannel(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {adminId: number, chanID: number, userIds: number[]}) : Promise<void>
  {
    try {
      const {chanID, adminId, userIds} = data;
      const isAdmin = await this.chatService.isAdmin(chanID, adminId);
      if (!isAdmin) {
        throw new WsException('Cannot add users to channel, not admin');
      }
      const channel = await this.chatService.findChannelbyId(chanID);
      const userDetails = await Promise.all(userIds.map(userId => this.userService.findOneById(userId)));
      for (let i = 0; i < userIds.length; i++) {
        let userId = userIds[i];
        let user = userDetails[i];
        let isBanned = await this.chatService.isBanned(chanID, userId);
        if (isBanned) {
          const userRoomId = 'userID_' + adminId.toString() + '_room';
          this.server.to(userRoomId).emit('joinErrorUserIsBanned');
          continue;
        }        
        await this.chatService.createOneChanMember(chanID, userId);
        const userSockets = this.userSocketsService.getUserSocketIds(userId);
        for (const socket of userSockets) {
          if (socket){
            const ChanRoomId = 'chan_'+ chanID + '_room';
            socket.join(ChanRoomId);
          }
        }
        const userRoomId = 'userId_' + userId.toString() + '_room';
        this.server.to(userRoomId).emit('addedToRoom', channel.name);
        const ChanRoomId = 'chan_'+ chanID + '_room';
        const content = 'I just joined the channel 😸';
        const joinMessage = await this.chatService.createOneChanMessage(userId, user.nickname, chanID, content);
        this.server.to(ChanRoomId).emit('SentChanMessage', joinMessage);
      }
    }
    catch (error){
      console.log(error);
      throw new WsException(error.message || 'Could not public or private channel');
    }
  }

  @SubscribeMessage('isMember')
  async handleIsMember(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, memberId: number, userId: number}) : Promise<void>
  {
    try {
    const {chanId, memberId, userId} = data;
    // console.log("ISMEMBER entering");
      const isMember = await this.chatService.isMember(chanId, memberId);
      const ChanRoomId = 'chan_'+ chanId + '_room';
      const memberRoomId = 'userID_'+ userId + '_room';
      // console.log("isMember", isMember);
      this.server.to(memberRoomId).emit('foundIsMember', isMember);
      // client.emit('MemberisAdmin', updatedChanMember);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not make member admin');
    }
  }

  @SubscribeMessage('isMemberAdmin')
  async handleIsMemberAdmin(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, memberId: number, userId: number}) : Promise<void>
  {
    try {
    const {chanId, userId, memberId} = data;
    // console.log("ISADMIN entering");
      const isAdmin = await this.chatService.isAdmin(chanId, memberId);
      const ChanRoomId = 'chan_'+ chanId + '_room';
      const memberRoomId = 'userID_'+ userId + '_room';
      // console.log("isAdmin", isAdmin);
      this.server.to(memberRoomId).emit('foundAdminStatus', isAdmin);
      // client.emit('MemberisAdmin', updatedChanMember);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not make member admin');
    }
  }

  @SubscribeMessage('isChanOwner')
  async handleIsChanOwner(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, memberId: number, userId: number}) : Promise<void>
  {
    try {
    const {chanId, userId, memberId} = data;
    // console.log("ISOWNER entering");
      const isOwner = await this.chatService.isOwner(chanId, memberId);
      const ChanRoomId = 'chan_'+ chanId + '_room';
      const memberRoomId = 'userID_'+ userId + '_room';
      // console.log("isOwner", isOwner);
      this.server.to(memberRoomId).emit('foundOwnerStatus', isOwner);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not make member admin');
    }
  }

    /**
   * muteMember event, will emit to the client an event with the mutedMember
   * @param client 
   * @param data 
   */
    @SubscribeMessage('muteMember')
    async handleMuteMember(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, memberToMuteId: number, adminId: number, muteDuration: number}) : Promise<void>
    {
      try {
        const {chanId, memberToMuteId, adminId, muteDuration} = data;
        const mutedMember = await this.chatService.muteMember(data);
        const ChanRoomId = 'chan_'+ chanId + '_room';
        const mutedMemberRoomId = 'userID_' + memberToMuteId.toString() + '_room';
        const channel = await this.chatService.findChannelbyId(chanId);
        const chan_name = channel.name;
        this.server.to(mutedMemberRoomId).emit('youHaveBeenMuted', chan_name);
        this.server.to(ChanRoomId).emit('memberMuted');
        // client.emit('memberIsMuted', mutedMember);
      }
      catch (error) {
        console.log(error);
        throw new WsException(error.message || 'Could not mute member');
      }
    }
  
    @SubscribeMessage('banMember')
    async handleBanMember(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, memberToBanId: number, adminId: number}) : Promise<void>
    {
      try {
        console.log("TOBAN");
        const {chanId, memberToBanId, adminId} = data;
        const content = 'I was banned from the channel 🙀';
        const user = await this.userService.findOneById(memberToBanId);
        const joinMessage = await this.chatService.createOneChanMessage(memberToBanId, user.nickname, chanId, content);
        await this.chatService.banMember(data);
          const ChanRoomId = 'chan_'+ chanId + '_room';
          //leave room 
          const userSockets = this.userSocketsService.getUserSocketIds(memberToBanId);
          for (const socket of userSockets) {
            if (socket){
              const ChanRoomId = 'chan_'+ chanId + '_room';
              socket.leave(ChanRoomId);
            }
          }
        const bannedMemberRoomId = 'userID_' + memberToBanId.toString() + '_room';
        const channel = await this.chatService.findChannelbyId(chanId);
        const chan_name = channel.name;
        this.server.to(ChanRoomId).emit('memberBanned');
        this.server.to(ChanRoomId).emit('SentChanMessage', joinMessage);
        this.server.to(bannedMemberRoomId).emit('youWereBanned', chan_name);
          // client.emit('memberIsBanned', bannedMember);
      } 
      catch (error) {
        console.log(error);
        throw new WsException(error.message || 'Could not ban Member');
      }
    }
  
    @SubscribeMessage('kickMember')
    async handleKickMember(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number, memberToKickId: number, adminId: number}) : Promise<void>
    {
      try {
        const {chanId, memberToKickId, adminId} = data;
        const content = 'I was kicked from the channel 😿';
        const user = await this.userService.findOneById(memberToKickId);
        await this.chatService.createOneChanMessage(memberToKickId, user.nickname, chanId, content);
        const kickerRoomID = 'userID_' + chanId.toString() + '_room';
        await this.chatService.kickMember(data);
        const ChanRoomId = 'chan_'+ chanId + '_room';
        const userSockets = this.userSocketsService.getUserSocketIds(memberToKickId);
        for (const socket of userSockets) {
          if (socket){
            const ChanRoomId = 'chan_'+ chanId + '_room';
            socket.leave(ChanRoomId);
          }
        }
        const kickedMemberRoomId = 'userID_' + memberToKickId.toString() + '_room';
        const channel = await this.chatService.findChannelbyId(chanId);
        const chan_name = channel.name;
        this.server.to(kickedMemberRoomId).emit('youHaveBeenKicked', chan_name);
        this.server.to(ChanRoomId).emit('memberKicked');
      } 
      catch (error) {
        console.log(error);
        throw new WsException(error.message || 'Could not kick member');
      }
    }

  /**
   * makeMemberAdmin event makes a given member admin
   * and returns to the client an event with the updated
   * channel member
   * @param client 
   * @param data 
   */
  @SubscribeMessage('makeMemberAdmin')
  async handleMakeMemberAdmin(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanOwnerId:number, chanId: number, memberId: number}) : Promise<void>
  {
    try {
      console.log("ENTERING MAKE MEMBER ADMIN");
      const {chanId, memberId, chanOwnerId} = data;
      await this.chatService.makeChanAdmin(data);
      const memberRoomId = 'userID_'+ memberId + '_room';
      const ChanRoomId = 'chan_'+ chanId + '_room';
      const channel = await this.chatService.findChannelbyId(chanId);
      const chan_name = channel.name;
      const ownerRoomId = 'userID_'+ chanOwnerId + '_room';
      this.server.to(ChanRoomId).emit('newAdminInRoom');
      this.server.to(ownerRoomId).emit('succededInMakingMemberAdmin');
      this.server.to(memberRoomId).emit('youWereMadeAdmin', chan_name);
      // client.emit('MemberisAdmin', updatedChanMember);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not make member admin');
    }
  }


  @SubscribeMessage('removeAdminPriv')
  async handleRemoveAdminPriv(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanOwnerId:number, chanId: number, memberId: number}) : Promise<void>
  {
    try {
      console.log("ENTERING REMOVE MEMBER ADMIN");
      const {chanId, memberId, chanOwnerId} = data;
      const updatedChanMember = await this.chatService.removeChanAdmin(data);
      const memberRoomId = 'userID_'+ memberId + '_room';
      const ChanRoomId = 'chan_'+ chanId + '_room';
      console.log("updatedChanMember");
      const channel = await this.chatService.findChannelbyId(chanId);
      const chan_name = channel.name;
      const ownerRoomId = 'userID_'+ chanOwnerId + '_room';
      this.server.to(ChanRoomId).emit('newAdminInRoom');
      this.server.to(ownerRoomId).emit('succededInRemovingMemberAdmin');
      this.server.to(memberRoomId).emit('youWereRemovedAsAdmin', chan_name);
      // client.emit('MemberisAdmin', updatedChanMember);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not make member admin');
    }
  }

  /**
   * muteMember event, will emit to the client an event with the mutedMember
   * @param client 
   * @param data 
   */

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {chanId: number, userId: number}) : Promise<void>
  {
    try {
      console.log("leaving channel");
      const {chanId, userId} = data;
      const content = 'I just left the channel 😿';
      const user = await this.userService.findOneById(userId);
      const joinMessage = await this.chatService.createOneChanMessage(userId, user.nickname, chanId, content);
      await this.chatService.leaveChannel(chanId, userId);
      const members = await this.chatService.findAllMembersByChanID(chanId);
      if (members.length === 0) {
        await this.chatService.deleteChannel(chanId);
        this.server.emit('EmptyChannelDeleted');
      }
      const ChanRoomId = 'chan_'+ chanId + '_room';
      const userSockets = this.userSocketsService.getUserSocketIds(userId);
      for (const socket of userSockets) {
        if (socket){
          const ChanRoomId = 'chan_'+ chanId + '_room';
          socket.leave(ChanRoomId);
        }
      }
      const userRoom = 'userID_' + userId.toString() + '_room';
      const channel = await this.chatService.findChannelbyId(chanId);
      const response = {
        chan_name: channel.name,
        user_nickname: user.nickname
      };
      if (members.length === 0) {
        await this.chatService.deleteChannel(chanId);
        this.server.emit('EmptyChannelDeleted');
      }
      this.server.to(ChanRoomId).emit('SentChanMessage', joinMessage);
      this.server.to(ChanRoomId).emit('userLeftChannel', response);
      this.server.to(userRoom).emit('youLeftChannel', response);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'user could not leave channel');
    }
  }

  //--------------------------------------------------------------------------//
  //                           CHANNEL UPDATE EVENTS                          //
  //--------------------------------------------------------------------------//

  /**
   * event setChannelName to change the name of a channel
   * will check the user that is changing the name is admin
   * emit back to the client an event with the updated channel
   * @param client 
   * @param data 
   */
  @SubscribeMessage('setChannelName')
  async handleSetChannelName(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {chanMember:number, chanId:number, newChanName:string}) : Promise<void>
  {
    try {
      const {chanMember, chanId, newChanName} = data;
      const updatedChannel = await this.chatService.setChanName(data);
      const ChanRoomId = 'chan_'+ chanId + '_room';
      const chanName = updatedChannel.name;
      this.server.to(ChanRoomId).emit('chanNameChanged', chanName);
      // client.emit('channelNameChanged', updatedChannel);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not set channel name');
    }
  }

  /**
   * setNewPasswd event to update the password of a channel
   * returns the client an event with the updated channel
   * @param client 
   * @param data 
   */
  @SubscribeMessage('setNewPasswd')
  async handleSetNewUserPassword(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: {chanId: number; userId: number; newPasswd: string}): Promise<void>
  {
    try {
      const {chanId, userId, newPasswd} = data;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPasswd, saltRounds);
      const updatedChannel = await this.chatService.setChanPassword(chanId, userId, hashedPassword);
      const ChanRoomId = 'chan_'+ chanId + '_room';
      let content = 'I changed the channel`s password';
      const user = await this.userService.findOneById(userId);
      const message = await this.chatService.createOneChanMessage(userId, user.nickname, chanId, content);
      this.server.to(ChanRoomId).emit('chanPasswordChanged');
      this.server.to(ChanRoomId).emit('SentChanMessage', message);
      const userRoomId = 'userID_' + userId.toString() + '_room';
      this.server.to(userRoomId).emit('chanPasswordChangeSuccessful');
    }
    catch (error)
    {
      console.log(error);
      throw new WsException(error.message || 'Could not set new password');
    }
  }

  @SubscribeMessage('setChannelType')
  async handleSetChannelType(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {userId:number, chanId:number, newChanType:string, password?: string})
  {
    try {
      const {userId, chanId, newChanType, password} = data;
      console.log("inside set channel type");
      if (!Object.values(ChanType).includes(newChanType as ChanType)){
        throw new WsException('Invalid channel type');
      }
      console.log("after checking it is a type");
      console.log("newChanType: ", newChanType);
      console.log("password: ", password);
      if (newChanType === 'PROTECTED' && password) {
        console.log("changing to PROTECTED");
        if (password == '') {
          throw new WsException('Password cannot be empty');
        }
        console.log("password is valid");
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await this.chatService.setChanPassword(chanId, userId, hashedPassword);
        console.log("password was set");
      }
      else {
        await this.chatService.removeChanPassword(chanId, userId);
      }
      const updated_channel = await this.chatService.setChannelType(userId, chanId, ChanType[newChanType as keyof typeof ChanType]);
      console.log("channel type was changed");
      console.log("changed_channel: ", updated_channel);
      const ChanRoomId = 'chan_'+ chanId + '_room';
      let content = 'I changed the channel type to ';
      content += newChanType;
      const user = await this.userService.findOneById(userId);
      const message = await this.chatService.createOneChanMessage(userId, user.nickname, chanId, content);
      // this.server.to(ChanRoomId).emit('chanTypeChanged', newChanType);
      this.server.emit('chanTypeChanged', newChanType);
      this.server.to(ChanRoomId).emit('SentChanMessage', message);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not set channel type');
    }
  }

  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {userId:number, chanId:number, chanName: string})
  {
    try {
      const {userId, chanId, chanName} = data;
      console.log("inside set channel type");
      await this.chatService.deleteChannel(chanId);
      const ChanRoomId = 'chan_' + chanId + '_room';
      const sockets = await this.server.in(ChanRoomId).fetchSockets();

      for (const socket of sockets) {
        socket.leave(ChanRoomId);
      }
        this.server.emit('channelDeleted', chanName);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not delete channel');
    }
  }

  //--------------------------------------------------------------------------//
  //                                 USER EVENTS                              //
  //--------------------------------------------------------------------------//

  /**
   * 'getUserInfo: event to get the user information of current client
   * emits an event 'userInfo' to client with the user info,
   * @param client 
   * @returns 
   */
  @SubscribeMessage('getUserInfo')
  async handleUserInfo(@ConnectedSocket() client: Socket): Promise<void> {

    try {

      const userData = await this.chatService.getUserFromSocket(client);
      if (!userData){
        throw new WsException('user was not found');
      }
      const { id, email, nickname, avatarFilename } = userData;

      const userRoomId = 'userID_' + id.toString() + '_room';
      this.server.to(userRoomId).emit('userInfo', {
        id,
        email,
        nickname,
        avatarFilename,
      });
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could get user info');
    }
  }

  @SubscribeMessage('getUserStatus')
  async handleGetUserStatus(@ConnectedSocket() client: Socket,
  @MessageBody() data: {userId: number; memberId:number}): Promise<void> {
    try {
      const { userId, memberId } = data;
      const userSockets = this.userSocketsService.getUserSocketIds(memberId);
      const userRoomId = 'userID_' + userId.toString() + '_room';
  
      if (userSockets.length === 0)
      {
        this.server.to(userRoomId).emit('foundUserStatus', { status: false, memberId });
      }
      else {
        this.server.to(userRoomId).emit('foundUserStatus', { status: true, memberId });
      }
  
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not get user info');
    }
  }
  

  @SubscribeMessage('getUserStartsBy')
  async handleGetUsersStartBy(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {startBy:string, userId:number}) : Promise<void>
  {
    try {
      const {startBy, userId} = data;
      const users = await this.chatService.findUserStartsby(startBy, userId);
      const userRoomId = 'userID_' + userId.toString() + '_room';
      this.server.to(userRoomId).emit('usersStartByFound', users);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not get users that start by');
    }
  }

  @SubscribeMessage('getAllUsers')
  async handleGetAllUsers(
    @ConnectedSocket() client: Socket) : Promise<void>
  {
    try {
      let users = await this.userService.findAll();
      if (!users){
        throw new WsException('users were not found');
      }
      const userData = await this.chatService.getUserFromSocket(client);
      if (!userData){
        throw new WsException('user was not found');
      }
      users = users.filter(user => user.id !== userData.id);
      const userRoomId = 'userID_' + userData.id.toString() + '_room';
      this.server.to(userRoomId).emit('allUsersFound', users);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not get all users');
    }
  }


  //*

  @SubscribeMessage('gameInvitation')
  async handleGameInvitation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {inviter:number, invited:number, inviterNick: string, invitedNick: string}) : Promise<void>
  {
    try {
      console.log('SENDING INVITATION');
      const {inviter, invited, inviterNick, invitedNick} = data;
      const inviterRoomId = 'userID_' + inviter.toString() + '_room';
      const invitedRoomId = 'userID_' + invited.toString() + '_room';
      this.server.to(invitedRoomId).emit('youHaveBeenInvitedToPlay',  { inviterNick, inviterID: inviter });
      this.server.to(inviterRoomId).emit('playInvitationSend', invitedNick);
    }
    catch (error) {
      console.log(error);
      throw new WsException(error.message || 'Could not invite user to play');
    }
  }


  @SubscribeMessage('gameConfirmation')
  async handleGameConfirmation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {inviter:number, invited:number, response:boolean, inviterNick: string, invitedNick: string}) : Promise<void>
  {
    try {
      console.log('CONFIRMING INVITATION');
      const {inviter, invited, response, inviterNick, invitedNick} = data;
      const inviterRoomId = 'userID_' + inviter.toString() + '_room';
      const invitedRoomId = 'userID_' + invited.toString() + '_room';
      console.log("inviteR: ", inviterNick);
      console.log("inviteD: ", invitedNick);
      // console.log("inviteR: ", inviteRNick);
      // console.log("inviteD: ", inviteRNick);
      if (response === true) {
        this.server.to(invitedRoomId).emit('youAcceptedGame', { inviterNick, inviterID: inviter, invitedNick, invitedID: invited });
        // this.server.to(inviterRoomId).emit('gameAccepted', { inviterNick, inviterID: inviter, invitedNick, invitedID: invited });
        // this.server.to(inviterRoomId).emit('gameAccepted', inviterNick, inviter, invitedNick, invited);
        this.server.to(inviterRoomId).emit('gameAccepted', { inviterNick, inviterID: inviter, invitedNick, invitedID: invited });

      }
      else if (response === false) {
        this.server.to(invitedRoomId).emit('youRejectedGame', inviterNick);
        // this.server.to(inviterRoomId).emit('gameRejected', { inviterNick, inviterID: inviter, invitedNick, invitedID: invited });
        this.server.to(inviterRoomId).emit('gameRejected', inviterNick, inviter, invitedNick, invited);

      }
    }
    catch (error) {
      console.log(error)
      throw new WsException(error.message || 'Could not invite user to play');
    }
  }

  //--------------------------------------------------------------------------//
  //                            USER STATES EVENT                             //
  //--------------------------------------------------------------------------//

  
  @SubscribeMessage('friendsState')
  async handleFriendStates(socket: Socket, payload: number[]) {
    let response: { [id: number]: friendState } = {}
    for (let userID of payload){
      let userChatSockets = this.userSocketsService.getUserSocketIds(userID)
      let userGameSockets = socketService.getUserSocketIds(userID)
      if (userChatSockets.length == 0){
        response[userID] = 'offline'
        continue
      }
      else
        response[userID] = 'online'
      for (let userSocket of userGameSockets){
        let player = players[userSocket.id]
        console.log("socketID:", userSocket.id)
        if (player !== undefined && player.workerId !== undefined){
          response[userID] = 'in game'
          break
        }
      }
    }
    socket?.emit('updatedState', response)
  }

  //--------------------------------------------------------------------------//
  //                        CONNECTION SET UP EVENTS                          //
  //--------------------------------------------------------------------------//
  /**
   * Still don't know the purpose of this :|
   * @param server 
   */
  afterInit(server: any) {
    this.logger.log('initialized');
  }

  /**
   * Handling connection of the socket 
   * @param client 
   * @param args 
   */
  async handleConnection(client: Socket, ...args:any[])
  {
    console.log("#####################  CONNECTION  ###########################");
    console.log('success connected with client id', client.id);
    try {
      
          const userData = await this.chatService.getUserFromSocket(client);
          console.log()
          if (!userData)
          {
            console.log("GOING TO DISCONNECT");
            client.disconnect();
           
            // throw new WsException('Invalid token.')
          }
          else{
      
            // console.log('userData: ', userData);
            const userID = userData.id;
            const userName = userData.nickname;
            console.log('ON CONNECTION: userID: ', userID);
            console.log("ON CONNECTION: userName:", userName);
            this.userSocketsService.setUser(userID, client);
            const userRoomId = 'userID_' + userID.toString() + '_room';
            const userChannels = await this.chatService.findAllChannelsByMember(userID);
      
            
            client.join(userRoomId);
            userChannels.forEach(channel =>{
              const chanRoomId = 'chan_'+ channel.chanId + '_room';
              client.join(chanRoomId);
            })
            client.emit('connectionResult', { msg: 'connected successfully'});
      
          }

    }
    catch(error){
      console.log(error)
      client.disconnect();
      // throw new WsException(error.message || 'handle connection');
    }
  }

  /**
   * Handling the disconnection of the socket
   * @param client 
   */
  async handleDisconnect(client: Socket)
  {
    console.log("*********************DISCONNECTION************************************");
    console.log('CLIENT DISCONNETING: ', client.id);
    try {
      const userData = await this.chatService.getUserFromSocket(client);
      if (userData)
      {
        const userID = userData.id;
        const userName = userData.nickname;
        console.log("DISCONNECTION: userid:", userID);
        console.log("DISCONNECTION: userName:", userName);
        this.userSocketsService.deleteUserSocket(userID, client);
        const userWithSocket = this.userSocketsService.getUserSocketIds(userID);
        const userRoomId = 'userID_' + userID.toString() + '_room';
        client.leave(userRoomId);
        const userChannels = await this.chatService.findAllChannelsByMember(userID);
        userChannels.forEach(chanMember => {
          const chanRoomId = 'chan_' + chanMember.chanId + '_room';
          client.leave(chanRoomId);
        });
      }
    }
    catch(error) {
      console.log(error)
      throw new WsException(error.message || 'Handle Disconnect');
    }
  }
}
