import { BigInt, log } from '@graphprotocol/graph-ts';

import {
  Account,
  Transaction,
  Vault,
  Withdrawal,
} from '../../generated/schema';

import * as vaultUpdateLibrary from './vault/vault-update';

export function buildIdFromAccountHashAndIndex(
  account: Account,
  transactionHash: string,
  transactionIndex: string
): string {
  return account.id
    .concat('-')
    .concat(transactionHash)
    .concat('-')
    .concat(transactionIndex);
}

export function buildIdFromAccountAndTransaction(
  account: Account,
  transaction: Transaction
): string {
  return buildIdFromAccountHashAndIndex(
    account,
    transaction.id,
    transaction.index.toString()
  );
}

export function getOrCreate(
  account: Account,
  vault: Vault,
  transaction: Transaction,
  tokenAmount: BigInt,
  sharesBurnt: BigInt
): Withdrawal {
  log.debug('[Withdraw] Get or create', []);
  let id = buildIdFromAccountAndTransaction(account, transaction);
  let withdrawal = Withdrawal.load(id);
  if (withdrawal === null) {
    withdrawal = new Withdrawal(id);
    withdrawal.timestamp = transaction.timestamp;
    withdrawal.blockNumber = transaction.blockNumber;
    withdrawal.account = account.id;
    withdrawal.vault = vault.id;
    withdrawal.tokenAmount = tokenAmount;
    withdrawal.sharesBurnt = sharesBurnt;
    withdrawal.transaction = transaction.id;
    let vaultUpdateId = vaultUpdateLibrary.buildIdFromVaultTxHashAndIndex(
      vault.id,
      transaction.id,
      transaction.index.toString()
    );
    withdrawal.vaultUpdate = vaultUpdateId;
    withdrawal.save();
  }
  return withdrawal as Withdrawal;
}
