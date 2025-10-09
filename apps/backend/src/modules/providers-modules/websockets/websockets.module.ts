import { Module } from '@nestjs/common';
import { WebsocketGetway } from './websocket.getway';

@Module({
  providers: [WebsocketGetway],
})
export class WebsocketsModule {}
