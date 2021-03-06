//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------

'use strict'

import * as net from 'net';
import * as crypto from 'crypto';
import { connect } from './connectHandler';
import { udpAssociate } from './udpHandler';
import { ISocks5Options } from '../../lib/constant';
import { REQUEST_CMD } from '../../lib/socks5Constant';
import * as socks5Helper from '../../lib/socks5Helper';

export function handleSocks5(client: net.Socket, data: Buffer, options: ISocks5Options): boolean {
  let dst = socks5Helper.refineDestination(data);
  
  switch (dst.cmd) {
    case REQUEST_CMD.CONNECT:
      connect(client, data, dst, options);
      break;
    case REQUEST_CMD.BIND:
      break;
    case REQUEST_CMD.UDP_ASSOCIATE:
      udpAssociate(client, data, dst, options);
      break;
    default:
      return false;
  }
  
  return true;
}