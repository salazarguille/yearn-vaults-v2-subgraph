import { BigInt, ethereum, Address } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { getTimestampInMillis } from "./commons";
import { ERC20 } from "../../generated/Registry/ERC20";
import { Vault as VaultContract } from "../../generated/Registry/Vault";

export function createVault(
  transactionId: string,
  vault: Address,
  apiVersion: string,
  deploymentId: BigInt,
  token: Address,
  event: ethereum.Event
): Vault {
  let vaultInstance = VaultContract.bind(vault)
  let erc20Instance = ERC20.bind(token)

  let id = vault.toHexString()
  let entity = new Vault(id)
  entity.transaction = transactionId
  entity.status = 'Added'
  entity.deploymentId = deploymentId
  entity.strategies = []

  entity.token = token
  entity.tokenName = erc20Instance.name()
  entity.tokenSymbol = erc20Instance.symbol()
  entity.tokenDecimals = BigInt.fromI32(erc20Instance.decimals())

  entity.vault = vault
  entity.vaultName = vaultInstance.name()
  entity.vaultSymbol = vaultInstance.symbol()
  entity.vaultDecimals = vaultInstance.decimals()
  entity.apiVersion = apiVersion

  entity.blockNumber = event.block.number
  entity.timestamp = getTimestampInMillis(event)
  entity.save()

  return entity
}

export function releaseVault(
  vault: Address,
  apiVersion: string,
  deploymentId: BigInt,
  event: ethereum.Event
): Vault | null {
  let id = vault.toHexString()
  let entity = Vault.load(id)
  if(entity !== null) {
    entity.status = 'Released'
    entity.apiVersion = apiVersion
    entity.deploymentId = deploymentId
    entity.blockNumber = event.block.number
    entity.timestamp = getTimestampInMillis(event)
    entity.save()
  }
  return entity
}