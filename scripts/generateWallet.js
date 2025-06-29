#!/usr/bin/env node

// Simple wallet generation script for demo purposes
const crypto = require('crypto');
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');

function generateRandomPrivateKey() {
  // Generate 32 random bytes
  const privateKey = crypto.randomBytes(32);
  return '0x' + privateKey.toString('hex');
}

async function generateTestWallet() {
  console.log('🔑 Generating Test Wallet for ZCORP Demo...\n');
  
  // Generate private key
  const privateKey = generateRandomPrivateKey();
  
  // Create account from private key
  const account = privateKeyToAccount(privateKey);
  
  console.log('✅ Test Wallet Generated:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Address: ${account.address}`);
  console.log(`🔐 Private Key: ${privateKey}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  SECURITY WARNINGS:');
  console.log('• This is a TEST wallet only - do not use for real funds');
  console.log('• Never commit private keys to version control');
  console.log('• Keep your .env file secure and never share it\n');
  
  console.log('📝 Next Steps:');
  console.log('1. Copy the private key above');
  console.log('2. Add it to your .env file:');
  console.log(`   ZCORP_PRIVATE_KEY=${privateKey}`);
  console.log('3. Fund this address with some ETH on Base for gas fees');
  console.log('4. The wallet will be able to deploy tokens on behalf of ZCORP\n');
  
  console.log('💰 Funding Instructions:');
  console.log(`• Send 0.01-0.1 ETH to: ${account.address}`);
  console.log('• Use Base network (Chain ID: 8453)');
  console.log('• You can bridge ETH to Base at: https://bridge.base.org\n');
  
  return { address: account.address, privateKey };
}

// Run the script
if (require.main === module) {
  generateTestWallet().catch(console.error);
}

module.exports = { generateTestWallet, generateRandomPrivateKey };