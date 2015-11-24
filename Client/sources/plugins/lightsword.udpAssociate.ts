//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------

'use strict'

import * as net from 'net';
import * as dgram from 'dgram';
import * as crypto from 'crypto';
import { ISocks5, ISocks5Options, IStreamTransportOptions } from '../socks5/plugin';
import { negotiateAsync } from './lightsword';

class LightSwordUdpAssociate implements ISocks5 {
  cipherKey: string;
  vNum: number = 0;
  transitSocket: net.Socket;
    
  disposeSocket(error: Error, from: any) {
    this.transitSocket.removeAllListeners();
    this.transitSocket.end();
    this.transitSocket.destroy();
    this.transitSocket = null;
  }
  
  async negotiate(options: ISocks5Options, callback: (success: boolean, reason?: string) => void) {
    let _this = this;
    
    this.transitSocket = net.createConnection(options.dstPort, options.dstAddr, async () => {
      let result = await negotiateAsync(_this.transitSocket, options);
      let success = result.success;
      let reason = result.reason;
      
      _this.transitSocket.removeAllListeners('error');
      _this.cipherKey = result.cipherKey;
      _this.vNum = result.vNum;
      callback(success, reason);  
    });
    
    this.transitSocket.on('error', (err) => _this.disposeSocket(err, 'connect'));
  }
  
  async sendCommand(options: ISocks5Options, callback: (success: boolean, reason?: string) => void) {
    
  }
  
  async transport(options: IStreamTransportOptions) {
    
  }
}

module.exports = LightSwordUdpAssociate;