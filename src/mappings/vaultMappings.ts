import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  StrategyAdded as StrategyAddedEvent,
  StrategyReported as StrategyReportedEvent,
  Deposit1Call as DepositCall,
  Transfer as TransferEvent,
  Withdraw1Call as WithdrawCall,
  Vault as VaultContract,
} from "../../generated/Registry/Vault";
import { Strategy, StrategyReport, Vault } from "../../generated/schema";
import {
  internalMapDeposit,
  internalMapTransfer,
  internalMapWithdrawal,
} from "../utils/vaultBalanceUpdates";
import { buildIdFromEvent, createEthTransaction, getTimestampInMillis } from "../utils/commons";
import { getOrCreateVault } from "../utils/vault";
import { createStrategy, reportStrategy } from "../utils/strategy";


export function addStrategyToVault(
  transactionId: string,
  vaultAddress: Address,
  strategy: Address,
  debtLimit: BigInt,
  performanceFee: BigInt,
  rateLimit: BigInt,
  event: ethereum.Event,
): void {
  let entity = getOrCreateVault(vaultAddress, false)
  if(entity !== null) {
    let newStrategy = createStrategy(
      transactionId,
      strategy,
      vaultAddress,
      debtLimit,
      rateLimit,
      performanceFee,
      event
    )
    // NOTE: commented since field is derived
    // let strategies = entity.strategies
    // strategies.push(newStrategy.id)
    // entity.strategies = strategies
    // entity.save()
  }
}

export function handleStrategyAdded(event: StrategyAddedEvent): void {
  let ethTransaction = createEthTransaction(event, "StrategyAddedEvent")

  // TODO: refactor to createStrategy since derived links vault + strat
  addStrategyToVault(
    ethTransaction.id,
    event.address,
    event.params.strategy,
    event.params.debtLimit,
    event.params.performanceFee,
    event.params.rateLimit,
    event
  )
}

export function handleStrategyReported(event: StrategyReportedEvent): void {
  let ethTransaction = createEthTransaction(event, "StrategyReportedEvent")
  reportStrategy(
    ethTransaction.id,
    event.params.strategy.toHexString(),
    event.params.gain,
    event.params.loss,
    event.params.totalGain,
    event.params.totalLoss,
    event.params.totalDebt,
    event.params.debtAdded,
    event.params.debtLimit,
    event,
  )
}


//  VAULT BALANCE UPDATES

export function handleDeposit(call: DepositCall): void {
  let vaultContract = VaultContract.bind(call.to)
  internalMapDeposit(
    call.transaction.hash,
    call.transaction.index,
    call.to,
    call.from,
    call.inputs._amount,
    vaultContract.totalAssets(),
    vaultContract.totalSupply(),
    vaultContract.pricePerShare(),
    call.block.timestamp,
    call.block.number
  );
}

export function handleWithdrawal(call: WithdrawCall): void {
  let vaultContract = VaultContract.bind(call.to)
 internalMapWithdrawal(
  call.transaction.hash,
  call.transaction.index,
  call.to,
  call.from,
  call.inputs._shares,
  vaultContract.totalAssets(),
  vaultContract.totalSupply(),
  vaultContract.pricePerShare(),
  call.block.timestamp,
  call.block.number
 );
}

export function handleTransfer(event: TransferEvent): void {
  let vaultContract = VaultContract.bind(event.address)
  internalMapTransfer(
    event.transaction.hash,
    event.transaction.index,
    event.address,
    event.params.sender,
    event.params.receiver,
    event.params.value,
    vaultContract.totalAssets(),
    vaultContract.totalSupply(),
    event.block.timestamp,
    event.block.number
  );
}