import { Address, ethereum, BigInt  } from "@graphprotocol/graph-ts";
import {
  Vault,
} from "../../generated/schema";

import { getTimestampInMillis } from "./commons";
import { Vault as VaultContract } from '../../generated/Registry/Vault';
import { Vault as VaultTemplate } from "../../generated/templates";
import { BIGINT_ZERO } from '../utils/constants';
import { getOrCreateToken } from '../utils/token';

const createNewVaultFromAddress = (vaultAddress: Address): Vault => {
    let id = vaultAddress.toHexString();
    let vaultEntity = new Vault(id);
    let vaultContract = VaultContract.bind(vaultAddress);
  
    let token = getOrCreateToken(vaultContract.token());
    let shareToken = getOrCreateToken(vaultAddress);

    vaultEntity.token = token.id;
    vaultEntity.shareToken = shareToken.id;

    // vault fields
    vaultEntity.timestamp = BIGINT_ZERO;
    vaultEntity.blockNumber = BIGINT_ZERO;
    vaultEntity.activation = vaultContract.activation();
    vaultEntity.apiVersion = vaultContract.apiVersion();

    // NOTE: empty at start
    vaultEntity.strategies = [];

    return vaultEntity;
}


export function getOrCreateVault(vaultAddress: Address): Vault {
    let id = vaultAddress.toHexString();
    let vault = Vault.load(id);
  
    if (vault == null) {
      vault = createNewVaultFromAddress(vaultAddress); 
        
      vault.save();
      // TODO: do we need to create vault template here?
      // VaultTemplate.create(vaultAddress);
    }
  
    return vault as Vault;
}

export function createVault(
    transactionId: string,
    vault: Address,
    status: string,
    apiVersion: string,
    deploymentId: BigInt,
    token: Address,
    event: ethereum.Event
  ): Vault {
  
    let id = vault.toHexString()
    let vaultEntity = Vault.load(id)
    if(vaultEntity == null) {
      vaultEntity = createNewVaultFromAddress(vault); 
      vaultEntity.transaction = transactionId
      vaultEntity.status = status
      vaultEntity.deploymentId = deploymentId
      vaultEntity.apiVersion = apiVersion
  
      VaultTemplate.create(vault);
    }
  
    vaultEntity.blockNumber = event.block.number
    vaultEntity.timestamp = getTimestampInMillis(event)
    vaultEntity.save()
    return vaultEntity as Vault
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