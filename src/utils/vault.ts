import { Address, ethereum, BigInt  } from "@graphprotocol/graph-ts";
import {
  Vault,
} from "../../generated/schema";

import { createEthTransaction, getTimestampInMillis } from "./commons";
import { Vault as VaultContract } from '../../generated/Registry/Vault';
import { Vault as VaultTemplate } from "../../generated/templates";
import { BIGINT_ZERO } from '../utils/constants';
import { getOrCreateToken } from '../utils/token';
import { createStrategy } from "./strategy";

const createNewVaultFromAddress = (vaultAddress: Address): Vault => {
    let id = vaultAddress.toHexString();
    let vaultEntity = new Vault(id);
    let vaultContract = VaultContract.bind(vaultAddress);
  
    let token = getOrCreateToken(vaultContract.token());
    let shareToken = getOrCreateToken(vaultAddress);

    // TODO Create transaction vaultEntity.transaction = transactionId
    vaultEntity.transaction = "0";
    vaultEntity.token = token.id;
    vaultEntity.shareToken = shareToken.id;

    // vault fields
    vaultEntity.activation = vaultContract.activation();
    vaultEntity.apiVersion = vaultContract.apiVersion();

    // NOTE: empty at start
    vaultEntity.strategies = [];

    return vaultEntity;
}

export function getOrCreateVault(vaultAddress: Address, createTemplate: boolean): Vault {
    let id = vaultAddress.toHexString();
    let vault = Vault.load(id);
  
    if (vault == null) {
      vault = createNewVaultFromAddress(vaultAddress)

      if(createTemplate) {
        VaultTemplate.create(vaultAddress);
      }
    }
  
    return vault as Vault;
}

export function createVault(
    transactionId: string,
    vault: Address,
    classification: string,
    apiVersion: string,
    deploymentId: BigInt,
    createTemplate: boolean,
    event: ethereum.Event
  ): Vault {
  
    let id = vault.toHexString()
    let vaultEntity = Vault.load(id)
    if(vaultEntity == null) {
      vaultEntity = createNewVaultFromAddress(vault); 
      vaultEntity.transaction = transactionId
      vaultEntity.classification = classification
      // vaultEntity.deploymentId = deploymentId
      vaultEntity.apiVersion = apiVersion
      if(createTemplate) {
        VaultTemplate.create(vault);
      }
    }
  
    // vaultEntity.blockNumber = event.block.number
    // vaultEntity.timestamp = getTimestampInMillis(event)
    vaultEntity.save()
    return vaultEntity as Vault
  }
  
  // TODO: implement this
  export function releaseVault(
    vault: Address,
    apiVersion: string,
    releaseId: BigInt,
    event: ethereum.Event
  ): Vault | null {
    let id = vault.toHexString()
    let entity = Vault.load(id)
    if(entity !== null) {
      // TODO: implement this
      // entity.status = 'Released'
      // entity.apiVersion = apiVersion
      // entity.deploymentId = deploymentId
      // entity.blockNumber = event.block.number
      // entity.timestamp = getTimestampInMillis(event)
      // entity.save()
    }
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