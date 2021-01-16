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

export function createStrategyReport(
  transactionId: string,
  strategyId: string,
  gain: BigInt,
  loss: BigInt,
  totalGain: BigInt,
  totalLoss: BigInt,
  totalDebt: BigInt,
  debtAdded: BigInt,
  debtLimit: BigInt,
  event: ethereum.Event
): StrategyReport {
  let id = buildIdFromEvent(event)
  let entity = new StrategyReport(id)
  entity.strategy = strategyId
  entity.transaction = transactionId
  entity.gain = gain
  entity.loss = loss
  entity.totalGain = totalGain
  entity.totalLoss = totalLoss
  entity.totalDebt = totalDebt
  entity.debtAdded = debtAdded
  entity.debtLimit = debtLimit
  
  entity.blockNumber = event.block.number
  entity.timestamp = getTimestampInMillis(event)
  entity.save()
  return entity
}

export function reportStrategy(
  transactionId: string,
  strategyId: string,
  gain: BigInt,
  loss: BigInt,
  totalGain: BigInt,
  totalLoss: BigInt,
  totalDebt: BigInt,
  debtAdded: BigInt,
  debtLimit: BigInt,
  event: ethereum.Event
):void {
  let strategy = Strategy.load(strategyId)
  if (strategy !== null) {
    let strategyReport = createStrategyReport(
      transactionId,
      strategyId,
      gain,
      loss,
      totalGain,
      totalLoss,
      totalDebt,
      debtAdded,
      debtLimit,
      event
    )
    let reports = strategy.reports
    reports.push(strategyReport.id)
    strategy.reports = reports
    strategy.save()
  }
}

export function createStrategy(
  transactionId: string,
  strategy: Address,
  vault: Address,
  debtLimit: BigInt,
  rateLimit: BigInt,
  performanceFee: BigInt,
  event: ethereum.Event
): Strategy {
  let id = strategy.toHexString()
  let entity = new Strategy(id)
  entity.transaction = transactionId
  entity.address = strategy
  entity.vault = vault.toHexString()
  entity.reports = []
  entity.harvests = []
  entity.debtLimit = debtLimit
  entity.rateLimit = rateLimit
  entity.performanceFeeBps = performanceFee.toI32()
  entity.blockNumber = event.block.number
  entity.timestamp = getTimestampInMillis(event)
  entity.save()
  return entity
}

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
    let strategies = entity.strategies
    strategies.push(newStrategy.id)
    entity.strategies = strategies
    entity.save()
  }
}

export function handleStrategyAdded(event: StrategyAddedEvent): void {
  let ethTransaction = createEthTransaction(event, "StrategyAddedEvent")

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