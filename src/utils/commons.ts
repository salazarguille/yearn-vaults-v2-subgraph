import { log, Address, BigInt, ethereum, Bytes } from "@graphprotocol/graph-ts";
import {
  EthTransaction,
} from "../../generated/schema";

export function getTimestampInMillis(event: ethereum.Event): BigInt {
  return event.block.timestamp.times(BigInt.fromI32(1000));
}

export function getTimeInMillis(time: BigInt): BigInt {
  return time.times(BigInt.fromI32(1000));
}

// make a derived ID from transaction hash and big number
export function buildId(tx: Bytes, n: BigInt): string {
  return tx.toHexString().concat('-').concat(n.toString());
}

export function buildIdFromEvent(event: ethereum.Event): string {
  return event.transaction.hash.toHex() + "-" + event.logIndex.toString();
}

export function buildBlockId(block: ethereum.Block): string {
  return block.hash.toHex() + "-" + block.number.toString() + "-" + block.timestamp.toString();
}


export function buildUpdateId(address: Address, tx: Bytes, n: BigInt): string {
  return address
    .toHexString()
    .concat('-')
    .concat(tx.toHexString().concat('-').concat(n.toString()));
}

export function createEthTransaction(
  event: ethereum.Event,
  action: string
): EthTransaction {
  let id = buildIdFromEvent(event);
  log.info("Creating EthTransaction with id {}", [id]);
  let entity = new EthTransaction(id);
  entity.event = action;
  entity.from = event.transaction.from;
  entity.gasPrice = event.transaction.gasPrice;
  entity.gasSent = event.transaction.gasUsed;
  entity.hash = event.transaction.hash;
  entity.index = event.transaction.index;
  entity.to = event.transaction.to as Bytes;
  entity.value = event.transaction.value;
  entity.contract = event.address;
  entity.timestamp = getTimestampInMillis(event);
  entity.gasLimit = event.block.gasLimit;
  entity.blockNumber = event.block.number;
  entity.save();
  return entity;
}







