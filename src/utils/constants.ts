import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ETH_MAINNET_GOVERNANCE_ADDRESS =
  '0xba37b002abafdd8e89a1995da52740bbc013d992';
// Oracle Fantom https://ftmscan.com/address/0x57aa88a0810dfe3f9b71a9b179dd8bf5f956c46a#code
export const ETH_MAINNET_USDC_ORACLE_ADDRESS =
  '0x83d95e0d5f402511db06817aff3f9ea88224b030';
export const ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS =
  '0x25BF7b72815476Dd515044F9650Bf79bAd0Df655';
export const ETH_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  '0x8263e161A855B644f582d9C164C66aABEe53f927';

export const FTM_MAINNET_CALCULATIONS_SPOOKY_SWAP_ADDRESS =
  '0x1007eD6fdFAC72bbea9c719cf1Fa9C355D248691';
export const FTM_MAINNET_USDC_ORACLE_ADDRESS =
  '0x57AA88A0810dfe3f9b71a9b179Dd8bF5F956C46A';
export const FTM_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS =
  '0xec7Ac8AC897f5082B2c3d4e8D2173F992A097F24';
export const DEFAULT_DECIMALS = 18;
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export let DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export let MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export let MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);
export let YEARN_ENTITY_ID = '1';

export let CURVE_SETH_VAULT_END_BLOCK_CUSTOM = BigInt.fromI32(11881933);
export let YV_WBTC_VAULT_END_BLOCK_CUSTOM = BigInt.fromI32(12341475);
export let YV_LINK_VAULT_END_BLOCK_CUSTOM = BigInt.fromI32(12586056);

export const DON_T_CREATE_VAULT_TEMPLATE = false;
export const DO_CREATE_VAULT_TEMPLATE = true;

export let FTM_MAINNET_REGISTRY_ADDRESS =
  '0x41679043846d1B16b44FBf6E7FE531390e5bf092';
export let ETH_MAINNET_REGISTRY_ADDRESS_V1 =
  '0xe15461b18ee31b7379019dc523231c57d1cbc18c';
export let ETH_MAINNET_REGISTRY_ADDRESS_V2 =
  '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804';
export const ENDORSED = 'Endorsed';
export const API_VERSION_0_4_2 = '0.4.2';
export const API_VERSION_0_3_5 = '0.3.5';
export const ETH_MAINNET_NETWORK = 'mainnet';
export const FTM_MAINNET_NETWORK = 'fantom';
