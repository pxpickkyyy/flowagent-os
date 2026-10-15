import { ethers } from 'ethers';
import { ComplianceResult } from '../schemas/contracts.js';
import { avalancheService } from './avalancheService.js';

export class ComplianceError extends Error {
  public statusCode: number = 403;
  public complianceResult: ComplianceResult;

  constructor(message: string, result: ComplianceResult) {
    super(message);
    this.name = 'ComplianceError';
    this.complianceResult = result;
    Object.setPrototypeOf(this, ComplianceError.prototype);
  }
}

/**
 * Curated list of known OFAC/SDN blacklisted addresses (lowercased)
 */
const OFAC_SANCTIONED_ADDRESSES: Record<string, string> = {
  // Tornado Cash Core Contracts, Relayers, & Liquidity Pools
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b': 'OFAC SDN: Tornado Cash Router',
  '0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c': 'OFAC SDN: Tornado Cash Relayer Protocol',
  '0x8589427373d6d84e98730d7795d8f6f8731fda16': 'OFAC SDN: Tornado Cash 0.1 ETH Pool',
  '0x722122df12d4e14e13ac3b6895a86e84145b6967': 'OFAC SDN: Tornado Cash 1 ETH Pool',
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': 'OFAC SDN: Tornado Cash 10 ETH Pool',
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': 'OFAC SDN: Tornado Cash 100 ETH Pool',
  '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc': 'OFAC SDN: Tornado Cash 0.1 cDAI Pool',
  '0x22aaa73acd83de239072997441611fa3ec044e11': 'OFAC SDN: Tornado Cash 1 cDAI Pool',
  '0x0836222f2b2b24a3f36f98668ed8f0b38d1a872f': 'OFAC SDN: Tornado Cash 10 cDAI Pool',
  // Lazarus Group & Cyber Crime Syndicates
  '0x098b716b8aaf21512996dc57eb0615e2383e2f96': 'OFAC SDN: DPRK Lazarus Group (Ronin Bridge Exploit)',
  '0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b': 'OFAC SDN: Lazarus Group Associated Wallet',
  '0x53b6936513e738f44fb44927581b8466b0e8ba20': 'OFAC SDN: Lazarus Group Associated Wallet',
  '0x3cffd56b47b7b41c56258d9c7731abdc360e0738': 'OFAC SDN: Lazarus Group Exploit Hot Wallet',
  // Sanctioned Crypto Mixers & Exchanges (Garantex, Sinbad, Hydra, Blender, Suex, Chatex)
  '0x1da5821544e25c636c1417ba96ade4cf6d2f9b5a': 'OFAC SDN: Blender.io Mixer',
  '0x7f367cc41522ce07553e823bf3be79a889debe1b': 'OFAC SDN: Garantex Exchange Deposit Address',
  '0x2f389ce8bd8ff92de3402ffce4691d17fc4f6535': 'OFAC SDN: Suex OTC Russian Exchange',
  '0x1011e3b632f4d4128f6c449d7edb993e5c0d77d4': 'OFAC SDN: Sinbad.io Mixer Primary Wallet',
  '0x487a2a074c6ee5cb606ffc8413a216fcb7396a84': 'OFAC SDN: Hydra Darknet Marketplace Wallet',
};

/**
 * Curated list of known OFAC/SDN designated entities and vendors
 */
const OFAC_SANCTIONED_ENTITIES: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\btornado\s*cash\b/i, description: 'OFAC SDN: Tornado Cash Protocol' },
  { pattern: /\blazarus(?:\s*group|\s*cyber)?\b/i, description: 'OFAC SDN: Lazarus Group (DPRK)' },
  { pattern: /\bgarantex(?:\s*europe|\s*ou)?\b/i, description: 'OFAC SDN: Garantex Europe OU' },
  { pattern: /\bsuex(?:\s*otc)?\b/i, description: 'OFAC SDN: Suex OTC' },
  { pattern: /\bchatex\b/i, description: 'OFAC SDN: Chatex Exchange' },
  { pattern: /\bhydra\s*market\b/i, description: 'OFAC SDN: Hydra Darknet Marketplace' },
  { pattern: /\bblender\.io\b/i, description: 'OFAC SDN: Blender.io Mixer' },
  { pattern: /\bsinbad\.io\b/i, description: 'OFAC SDN: Sinbad Mixer' },
  { pattern: /\bwagner(?:\s*group|\s*pmc)?\b/i, description: 'OFAC SDN: PMC Wagner Group' },
];

export class ComplianceService {
  /**
   * Deterministic, zero-hallucination compliance check (< 1ms execution time)
   */
  checkCompliance(recipientAddress: string, vendorName: string): ComplianceResult {
    const t0 = performance.now();
    const rawAddress = (recipientAddress || '').trim();
    const normVendor = (vendorName || '').trim();

    // 0. Validate address checksum / format via ethers.isAddress
    if (!rawAddress || !ethers.isAddress(rawAddress)) {
      const checkDurationMs = Math.round((performance.now() - t0) * 100) / 100;
      return {
        passed: false,
        flagReason: `Invalid EVM checksum or malformed address: ${rawAddress || '(empty)'}`,
        checkDurationMs,
        checkedAddress: rawAddress,
        checkedVendor: vendorName,
      };
    }

    const normAddress = rawAddress.toLowerCase();

    // 1. Direct address match in OFAC/SDN blacklist
    if (OFAC_SANCTIONED_ADDRESSES[normAddress]) {
      const checkDurationMs = Math.round((performance.now() - t0) * 100) / 100;
      return {
        passed: false,
        flagReason: OFAC_SANCTIONED_ADDRESSES[normAddress],
        checkDurationMs,
        checkedAddress: recipientAddress,
        checkedVendor: vendorName,
      };
    }

    // 2. Deterministic vendor name match in OFAC/SDN list
    for (const entity of OFAC_SANCTIONED_ENTITIES) {
      if (entity.pattern.test(normVendor)) {
        const checkDurationMs = Math.round((performance.now() - t0) * 100) / 100;
        return {
          passed: false,
          flagReason: `Vendor match: ${entity.description}`,
          checkDurationMs,
          checkedAddress: recipientAddress,
          checkedVendor: vendorName,
        };
      }
    }

    const checkDurationMs = Math.round((performance.now() - t0) * 100) / 100;
    return {
      passed: true,
      checkDurationMs,
      checkedAddress: recipientAddress,
      checkedVendor: vendorName,
    };
  }

  /**
   * Distinguish EOA vs Smart Contract account code via on-chain provider.getCode
   */
  async checkReceiverCode(recipientAddress: string): Promise<{
    isContract: boolean;
    accountType: 'EOA' | 'CONTRACT';
    bytecodeLength: number;
  }> {
    if (!recipientAddress || !ethers.isAddress(recipientAddress)) {
      return { isContract: false, accountType: 'EOA', bytecodeLength: 0 };
    }

    try {
      const provider = avalancheService.getProvider();
      const code = await provider.getCode(recipientAddress);
      const isContract = code && code !== '0x' && code !== '0x0';
      return {
        isContract: Boolean(isContract),
        accountType: isContract ? 'CONTRACT' : 'EOA',
        bytecodeLength: code ? code.length : 0,
      };
    } catch {
      return { isContract: false, accountType: 'EOA', bytecodeLength: 0 };
    }
  }

  /**
   * Asserts compliance or throws ComplianceError (HTTP 403)
   */
  assertCompliance(recipientAddress: string, vendorName: string): ComplianceResult {
    const result = this.checkCompliance(recipientAddress, vendorName);
    if (!result.passed) {
      throw new ComplianceError(
        `Compliance violation: ${result.flagReason}`,
        result
      );
    }
    return result;
  }
}

export const complianceService = new ComplianceService();
