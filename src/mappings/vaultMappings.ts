import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  StrategyAdded as StrategyAddedEvent,
  StrategyReported as StrategyReportedEvent,
  DepositCall,
  Transfer as TransferEvent,
  WithdrawCall,
} from "../../generated/Registry/Vault";
import { Strategy, StrategyReport, Vault } from "../../generated/schema";
import {
  mapDeposit,
  mapTransfer,
  mapWithdrawal,
} from "../utils/vaultBalanceUpdates";
import { buildIdFromEvent, createEthTransaction, getTimestampInMillis } from "../utils/commons";

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
  entity.performanceFee = performanceFee
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
  let id = vaultAddress.toHexString()
  let entity = Vault.load(id)
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
  mapDeposit(call);
}

export function handleWithdrawal(call: WithdrawCall): void {
 mapWithdrawal(call);
}

export function handleTransfer(event: TransferEvent): void {
  mapTransfer(event);
}