import { parse } from 'cookie';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

export async function getUserFromSocket (client: Socket) {
  const cookie:string = client.handshake.headers.cookie;
  if (cookie)
  {
      const { access_token: authenticationToken} = parse(cookie);
      if (!authenticationToken) return;
      const user = await this.authservice.getUserfromAuthenticationToken(authenticationToken);
      return user;
  }
  console.log('there is no cookie :(')
}