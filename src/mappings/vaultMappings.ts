import { log } from '@graphprotocol/graph-ts';
import {
  StrategyAdded as StrategyAddedEvent,
  StrategyReported as StrategyReportedEvent,
  Deposit1Call as DepositCall,
  Transfer as TransferEvent,
  Withdraw1Call as WithdrawCall,
  Vault as VaultContract,
  Deposit2Call,
  Deposit1Call,
  Withdraw1Call,
  Withdraw2Call,
} from '../../generated/Registry/Vault';
import { BIGINT_ZERO, MAX_UINT } from '../utils/constants';
import * as strategyLibrary from '../utils/strategy';
import {
  getOrCreateTransactionFromCall,
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as vaultLibrary from '../utils/vault/vault';

export function handleStrategyAdded(event: StrategyAddedEvent): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyAddedEvent'
  );
  strategyLibrary.create(
    ethTransaction.id,
    event.params.strategy,
    event.address,
    event.params.debtLimit,
    event.params.rateLimit,
    event.params.performanceFee,
    event
  );
}

export function handleStrategyReported(event: StrategyReportedEvent): void {
  log.debug('[Vault mappings] Handle deposit', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyReportedEvent'
  );
  strategyLibrary.createReport(
    ethTransaction.id,
    event.params.strategy.toHexString(),
    event.params.gain,
    event.params.loss,
    event.params.totalGain,
    event.params.totalLoss,
    event.params.totalDebt,
    event.params.debtAdded,
    event.params.debtLimit,
    event
  );
}

//  VAULT BALANCE UPDATES

export function handleDeposit(call: DepositCall): void {
  log.debug('[Vault mappings] Handle deposit', []);
  let transaction = getOrCreateTransactionFromCall(call, 'vault.deposit()');
  let vaultContract = VaultContract.bind(call.to);
  vaultLibrary.deposit(
    transaction,
    call.from,
    call.to,
    MAX_UINT,
    call.outputs.value0,
    vaultContract.pricePerShare()
  );
}

export function handleDepositWithAmount(call: Deposit1Call): void {
  log.debug('[Vault mappings] Handle deposit with amount', []);
  let transaction = getOrCreateTransactionFromCall(call, 'vault.deposit(uint)');
  let vaultContract = VaultContract.bind(call.to);
  vaultLibrary.deposit(
    transaction,
    call.from,
    call.to,
    call.inputs._amount,
    call.outputs.value0,
    vaultContract.pricePerShare()
  );
}

export function handleDepositWithAmountAndRecipient(call: Deposit2Call): void {
  log.debug('[Vault mappings] Handle deposit with amount and recipient', []);
  let transaction = getOrCreateTransactionFromCall(
    call,
    'vault.deposit(uint,address)'
  );
  let vaultContract = VaultContract.bind(call.to);
  vaultLibrary.deposit(
    transaction,
    call.inputs._recipient,
    call.to,
    call.inputs._amount,
    call.outputs.value0,
    vaultContract.pricePerShare()
  );
}

export function handleWithdraw(call: WithdrawCall): void {
  log.info('[Vault mappings] Handle withdraw. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  let transaction = getOrCreateTransactionFromCall(call, 'vault.withdraw()');
  log.info('[Vault mappings] Handle withdraw(): Vault address {}', [
    call.to.toHexString(),
  ]);
  let vaultContract = VaultContract.bind(call.to);

  let withdrawnAmount = call.outputs.value0;
  let totalAssets = vaultContract.totalAssets();
  let totalSupply = vaultContract.totalSupply();
  let totalSharesBurnt = totalAssets.equals(BIGINT_ZERO)
    ? withdrawnAmount
    : withdrawnAmount.times(totalSupply).div(totalAssets);

  vaultLibrary.withdraw(
    call.from,
    call.to,
    withdrawnAmount,
    totalSharesBurnt,
    vaultContract.pricePerShare(),
    transaction
  );
}

export function handleWithdrawWithShares(call: Withdraw1Call): void {
  log.info('[Vault mappings] Handle withdraw with shares. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  let transaction = getOrCreateTransactionFromCall(
    call,
    'vault.withdraw(uint256)'
  );
  log.info('[Vault mappings] Handle withdraw(shares): Vault address {}', [
    call.to.toHexString(),
  ]);
  let vaultContract = VaultContract.bind(call.to);

  vaultLibrary.withdraw(
    call.from,
    call.to,
    call.outputs.value0,
    call.inputs._shares,
    vaultContract.pricePerShare(),
    transaction
  );
}

export function handleWithdrawWithSharesAndRecipient(
  call: Withdraw2Call
): void {
  log.info(
    '[Vault mappings] Handle withdraw with shares and recipient. TX hash: {}',
    [call.transaction.hash.toHexString()]
  );
  let transaction = getOrCreateTransactionFromCall(
    call,
    'vault.withdraw(uint256,address)'
  );
  log.info(
    '[Vault mappings] Handle withdraw(shares, recipient): Vault address {}',
    [call.to.toHexString()]
  );
  let vaultContract = VaultContract.bind(call.to);

  vaultLibrary.withdraw(
    call.inputs._recipient,
    call.to,
    call.outputs.value0,
    call.inputs._shares,
    vaultContract.pricePerShare(),
    transaction
  );
}

export function handleTransfer(event: TransferEvent): void {
  // let vaultContract = VaultContract.bind(event.address)
  // internalMapTransfer(
  //   event.transaction.hash,
  //   event.transaction.index,
  //   event.address,
  //   event.params.sender,
  //   event.params.receiver,
  //   event.params.value,
  //   vaultContract.totalAssets(),
  //   vaultContract.totalSupply(),
  //   event.block.timestamp,
  //   event.block.number
  // );
}
