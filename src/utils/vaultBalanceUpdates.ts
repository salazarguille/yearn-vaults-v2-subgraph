import { BigInt, ethereum as eth } from '@graphprotocol/graph-ts';

import {
    DepositCall,
    Transfer as TransferEvent,
    WithdrawCall,
    Vault as VaultContract
} from "../../generated/Registry/Vault";

import { 
    Transfer, 
    VaultUpdate, 
    Vault,
    Operation,
} from '../../generated/schema';

import {
    buildId,
    buildUpdateId
} from './commons';

import { getOrCreateAccount } from './account';
import { getOrCreateVault } from './vault';
import { getOrCreateToken } from './token';
import { BIGINT_ZERO, DEFAULT_DECIMALS } from '../utils/constants';

export function createOperation(
    id: string,
    vaultId: string,
    accountId: string,
    amount: BigInt,
    shares: BigInt,
    timestamp: BigInt,
    blockNumber: BigInt,
    type: string,
  ): Operation {
    let operation = new Operation(id);
    operation.vault = vaultId;
    operation.account = accountId;
    operation.amount = amount;
    operation.shares = shares;
  
    operation.shares = shares;
    operation.timestamp = timestamp;
    operation.blockNumber = blockNumber;
  
    operation.type = type;
  
    operation.save();
  
    return operation as Operation;
  }


export function createVaultUpdate(
    vaultUpdateId: string,
    timestamp: BigInt,
    blockNumber: BigInt,
    deposits: BigInt,
    withdrawals: BigInt, // withdrawal doesn't change
    sharesMinted: BigInt,
    sharesBurnt: BigInt, // shares burnt don't change
    vaultId: string,
    pricePerFullShare: BigInt,
  ): VaultUpdate {
    let vault = Vault.load(vaultId);
  
    let vaultUpdate = new VaultUpdate(vaultUpdateId);
  
    vaultUpdate.timestamp = timestamp;
    vaultUpdate.blockNumber = blockNumber;
  
    vaultUpdate.balance = deposits.minus(withdrawals);
    vaultUpdate.deposits = deposits;
    vaultUpdate.withdrawals = withdrawals;
  
    vaultUpdate.shareBalance = sharesMinted.minus(sharesBurnt);
    vaultUpdate.sharesMinted = sharesMinted;
    vaultUpdate.sharesBurnt = sharesBurnt;
    // NOTE: don't update vaultUpdate.sharesBurnt
  
    vaultUpdate.vault = vault.id;
    vaultUpdate.pricePerFullShare = pricePerFullShare;
  
    let vaultUpdates = vault.vaultUpdates;
    if (vaultUpdates.length > 0) {
      let previousVaultUpdate = VaultUpdate.load(vaultUpdates[vaultUpdates.length - 1]);
  
      // TODO: add update algorithm
      vaultUpdate.withdrawalFees = previousVaultUpdate.withdrawalFees;
      vaultUpdate.performanceFees = previousVaultUpdate.performanceFees;
      vaultUpdate.earnings = vaultUpdate.withdrawalFees.plus(vaultUpdate.performanceFees);
    } else {
      vaultUpdate.withdrawalFees = BIGINT_ZERO;
      vaultUpdate.performanceFees = BIGINT_ZERO;
      vaultUpdate.earnings = BIGINT_ZERO;
    }
  
    vaultUpdates.push(vaultUpdate.id);
    vault.vaultUpdates = vaultUpdates;
  
    vaultUpdate.save();
    vault.save();
  
    return vaultUpdate as VaultUpdate;
  }

export function mapDeposit(call: DepositCall): void {
    let id = buildId(call.transaction.hash, call.transaction.index);
    let vaultAddress = call.to;
  
    let account = getOrCreateAccount(call.from);
    let vault = getOrCreateVault(vaultAddress);
    let vaultContract = VaultContract.bind(vaultAddress);
  
    // TODO: link this line on contract
    let shares = vaultContract.totalAssets().equals(BIGINT_ZERO)
      ? call.inputs._amount
      : call.inputs._amount.times(vaultContract.totalSupply()).div(vaultContract.totalAssets());
  
    // this is not supported by AS, yet
    // let params: IParams = {
    //   id: id,
    //   vault: vault.id,
    //   account: account.id,
    //   amount: call.inputs._amount,
    //   shares: shares,
    //   timestamp: call.block.timestamp,
    //   blockNumber: call.block.number,
    //   type: 'Withdrawal',
    // };
  
    createOperation(
      id,
      vault.id,
      account.id,
      call.inputs._amount,
      shares,
      call.block.timestamp,
      call.block.number,
      'Deposit',
    );
  
    // TODO: vaultUpdate
  
    let vaultUpdateId = buildUpdateId(
      vaultAddress,
      call.transaction.hash,
      call.transaction.index,
    );
  
    createVaultUpdate(
      vaultUpdateId,
      call.block.timestamp,
      call.block.number,
      // call.inputs._amount, // don't pass
      call.inputs._amount,
      BIGINT_ZERO, // withdrawal doesn't change
      // shares, // don't pass
      shares,
      BIGINT_ZERO, // shares burnt don't change
      vault.id,
      vaultContract.pricePerShare(),
      // earnings, // don't pass
      // withdrawalFees, // don't pass
      // performanceFees, // don't pass
    );
  
    // TODO: accountUpdate
    // deposit.save();
  }
  
  export function mapWithdrawal(call: WithdrawCall): void {
    let id = buildId(call.transaction.hash, call.transaction.index);
    let vaultAddress = call.to;
  
    let account = getOrCreateAccount(call.from);
    let vault = getOrCreateVault(vaultAddress);
    let vaultContract = VaultContract.bind(vaultAddress);
  
    let amount = vaultContract
      .totalAssets()
      .times(call.inputs._shares)
      .div(vaultContract.totalSupply());
  
    createOperation(
      id,
      vault.id,
      account.id,
      amount,
      call.inputs._shares,
      call.block.timestamp,
      call.block.number,
      'Withdrawal',
    );
  
    let vaultUpdateId = buildUpdateId(
      vaultAddress,
      call.transaction.hash,
      call.transaction.index,
    );
  
    createVaultUpdate(
      vaultUpdateId,
      call.block.timestamp,
      call.block.number,
      // call.inputs._amount, // don't pass
      BIGINT_ZERO, // deposit doesn't change
      amount,
      // shares, // don't pass
      BIGINT_ZERO, // shares minted don't change
      call.inputs._shares,
      vault.id,
      vaultContract.pricePerShare(),
      // earnings, // don't pass
      // withdrawalFees, // don't pass
      // performanceFees, // don't pass
    );
  
    // TODO: accountUpdate
  }
  
  export function mapTransfer(event: TransferEvent): void {
    let id = buildId(event.transaction.hash, event.transaction.index);
  
    let vaultContract = VaultContract.bind(event.address);
  
    let token = getOrCreateToken(event.address);
    let sender = getOrCreateAccount(event.params.from);
    let receiver = getOrCreateAccount(event.params.from);
  
    let transfer = new Transfer(id.toString());
    transfer.from = sender.id;
    transfer.to = receiver.id;
  
    transfer.token = token.id;
    transfer.shares = event.params.value;
    transfer.amount = vaultContract
      .totalAssets()
      .times(event.params.value)
      .div(vaultContract.totalSupply());
  
    transfer.timestamp = event.block.timestamp;
    transfer.blockNumber = event.block.number;
  
    // TODO: accountUpdate
  
    transfer.save();
  }