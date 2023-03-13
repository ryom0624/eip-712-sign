import { task } from 'hardhat/config';
import { ethers, Wallet } from 'ethers';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { SignTypedDataVersion, signTypedData, TypedDataUtils } from '@metamask/eth-sig-util';
import { recoverTypedSignature_v4 as recoverTypedSignatureV4 } from 'eth-sig-util';
import { keccak256 } from '@ethersproject/keccak256';
import { arrayify, BytesLike, hexConcat, hexlify, hexZeroPad, isHexString } from '@ethersproject/bytes';

import { recoverAddress } from '@ethersproject/transactions';
import { verifyTypedData } from '@ethersproject/wallet';

const privKey = process.env.PRIVATE_KEY ?? '';
const wallet = new ethers.Wallet(privKey);

const domain = {
  name: 'My amazing dapp',
  version: '1',
  chainId: 31337,
  verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
};

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

let message: any = {
  from: {
    name: 'Cow',
    wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
  },
  to: {
    name: 'Bob',
    wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
  },
  contents: 'Hello, Bob!',
};

task('sign-meta', 'signing for EIP-712 by metamask sig-util', async (_, hre) => {
  console.log('wallet address: ', wallet.address);
  const types = {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
    EIP712Domain, // must
  };

  // const hash = _TypedDataEncoder.hash(domain, types, message);

  const signature = signTypedData({
    privateKey: Buffer.from(privKey, 'hex'),
    data: {
      types,
      primaryType: 'Mail',
      domain,
      message,
    },
    version: SignTypedDataVersion.V4,
  });

  console.log('signature: ', signature);

  // const recoveredAddr = recoverTypedSignatureV4({
  //   data: {
  //     types,
  //     primaryType: 'Mail',
  //     domain,
  //     message,
  //   },
  //   sig: signature,
  // });
  // console.log('recovered address: ', recoveredAddr);

  // const recoveredAddress = verifyTypedData(domain, types, message, signature);
  // if (recoveredAddress.toLocaleLowerCase() !== wallet.address.toLowerCase()) {
  //   throw Error('recovered address: ' + recoveredAddress);
  // }

  // console.log('recovered address: ', recoveredAddress);

  // get EIP712Decoder by hardhat-deploy
  const EIP712Decoder = await hre.deployments.get('EIP712Decoder');
  const contract = await hre.ethers.getContractAt('EIP712Decoder', EIP712Decoder.address);

  // console.log('domain: hash', await contract.GET_EIP712DOMAIN_PACKETHASH());
  // console.log('person from hash: ', await contract.GET_PERSON_PACKETHASH(message.from));
  // console.log('person to hash: ', await contract.GET_PERSON_PACKETHASH(message.to));
  // console.log('mail hash: ', await contract.GET_MAIL_PACKETHASH(message));
  // console.log('digest: ', await contract.generateDigest(message));

  const result = await contract.recoverAddress(message, signature);
  console.log('recovered address: ', result);
});

task('sign-eth', 'Signing for EIP-712 by Ethers.js', async (_, hre) => {
  const privKey = process.env.PRIVATE_KEY ?? '';
  const wallet = new ethers.Wallet(privKey);
  console.log('wallet address: ', wallet.address);

  const types = {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
    // EIP712Domain, // must not
  };

  const hash = _TypedDataEncoder.hash(domain, types, message);

  // const hash = keccak256(_TypedDataEncoder.encode(domain, types, message));
  // const domainHash = _TypedDataEncoder.hashDomain(domain);
  // console.log("domainHash: ", domainHash);
  // const messageTypes = _TypedDataEncoder.from(types);
  // console.log("messageTypes: %o", messageTypes);

  // const messageHash = messageTypes.hash(message);
  // console.log("messageHash: ", messageHash);
  // const hash = keccak256(hexConcat(["0x1901",domainHash,messageHash]));
  // console.log("hash: ", hash);

  const signature = await wallet._signTypedData(domain, types, message);
  console.log('signature: ', signature);

  // const raddress = recoverAddress(hash, signature);
  // console.log('recovered address: ', raddress);

  // const recoveredAddress = verifyTypedData(domain, types, message, signature);
  // if (recoveredAddress.toLocaleLowerCase() !== wallet.address.toLowerCase()) {
  //   throw Error('recovered address: ' + recoveredAddress);
  // }

  // console.log('result: ', recoveredAddress);

  // get EIP712Decoder by hardhat-deploy
  const EIP712Decoder = await hre.deployments.get('EIP712Decoder');
  const contract = await hre.ethers.getContractAt('EIP712Decoder', EIP712Decoder.address);

  // console.log('domain: hash', await contract.GET_EIP712DOMAIN_PACKETHASH());
  // console.log('person from hash: ', await contract.GET_PERSON_PACKETHASH(message.from));
  // console.log('person to hash: ', await contract.GET_PERSON_PACKETHASH(message.to));
  // console.log('mail hash: ', await contract.GET_MAIL_PACKETHASH(message));
  // console.log('digest: ', await contract.generateDigest(message));

  const result = await contract.recoverAddress(message, signature);
  console.log('recovered address: ', result);
});

/*
  domain hash:  0x39fb4e74e76528c30ee759f37899ea0ef90308eaf361da865846f60b655bb243
  person from hash:  0xfc71e5fa27ff56c350aa531bc129ebdf613b772b6604664f5d8dbe21b85eb0c8
  person to hash:  0xcd54f074a4af31b4411ff6a60c9719dbd559c221c8ac3492d9d872b041d703d1
  mail hash:  0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e

  digest: 0x4af8866c3671cd82fcaedafc820a41c51e9d945bbbfb45de23e478c6a20fbe90
*/
