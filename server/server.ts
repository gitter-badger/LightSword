//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------

'use strict'


import * as net from 'net';
import * as crypto from '../lib/cipher';
import { VPN_TYPE } from '../lib/constant'
import { handleSocks5 } from './socks5/index';

export class LsServer {
  cipherAlgorithm: string;
  password: string;
  port: number;
  timeout: number;
  
  private blacklist = new Set<string>();
  private server: net.Server;
  
  constructor(options: { cipherAlgorithm: string, password: string, port: number, plugin: string }) {
    let _this = this;
    Object.getOwnPropertyNames(options).forEach(n => _this[n] = options[n]);
  }
  
  start() {
    let me = this;
    
    let server = net.createServer(async (client) => {
      if (me.blacklist.has(client.remoteAddress)) return client.dispose();
      
      let data = await client.readAsync();
      if (!data) return client.dispose();
      
      let meta = crypto.SupportedCiphers[me.cipherAlgorithm];
      let ivLength = meta[1];
      let iv = new Buffer(ivLength);
      data.copy(iv, 0, 0, ivLength);
      
      let decipher = crypto.createDecipher(me.cipherAlgorithm, me.password, iv);
      
      let et = new Buffer(2);
      data.copy(et, 0, ivLength, ivLength + 2);
      let dt = decipher.update(et);
      let vpnType = dt[0];
      let paddingSize = dt[1];
      
      let request = new Buffer(data.length - ivLength - 2 - paddingSize);
      data.copy(request, 0, ivLength + 2 + paddingSize, data.length);
      request = decipher.update(request);
      
      let options = {
        decipher,
        password: me.password,
        cipherAlgorithm: me.cipherAlgorithm,
        timeout: me.timeout
      };
      
      let handled = false;
      if (vpnType === VPN_TYPE.SOCKS5) {
        handled = handleSocks5(client, request, options);
      }
      
      if (handled) return;
      me.blacklist.add(client.remoteAddress);
      client.dispose();
    });
    
    server.listen(this.port);
    server.on('error', (err) => console.error(err.message));
    this.server = server;
  }
  
  stop() {
    this.server.end();
    this.server.close();
    this.server.destroy();
  }
    
}