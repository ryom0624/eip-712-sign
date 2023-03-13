pragma solidity ^0.8.13;
// SPDX-License-Identifier: MIT

import "hardhat/console.sol";

struct Person {
    string name;
    address wallet;
}

bytes32 constant PERSON_TYPEHASH = keccak256("Person(string name,address wallet)");

struct Mail {
    Person from;
    Person to;
    string contents;
}

bytes32 constant MAIL_TYPEHASH = keccak256(
    "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
);

struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
}

bytes32 constant EIP712DOMAIN_TYPEHASH = keccak256(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
);

contract EIP712Decoder {
    /**
     * @dev Recover signer address from a message by using their signature
     * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
     * @param sig bytes signature, the signature is generated using web3.eth.sign()
     */
    function recover(bytes32 hash, bytes memory sig)
        internal
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;

        //Check the signature length
        if (sig.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            return ecrecover(hash, v, r, s);
        }
    }

    // fixed domain separator
    function getDomain() internal pure returns (EIP712Domain memory) {
        return
            EIP712Domain(
                "My amazing dapp",
                "1",
                31337,
                address(0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC)
            );
    }

    function GET_EIP712DOMAIN_PACKETHASH() public pure returns (bytes32) {
        EIP712Domain memory _domain = getDomain();

        bytes memory encoded = abi.encode(
            EIP712DOMAIN_TYPEHASH,
            keccak256(bytes(_domain.name)),
            keccak256(bytes(_domain.version)),
            _domain.chainId,
            _domain.verifyingContract
        );

        return keccak256(encoded);
    }

    function GET_MAIL_PACKETHASH(Mail memory _mail) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    MAIL_TYPEHASH,
                    GET_PERSON_PACKETHASH(_mail.from),
                    GET_PERSON_PACKETHASH(_mail.to),
                    keccak256(bytes(_mail.contents))
                )
            );
    }

    function GET_PERSON_PACKETHASH(Person memory _person)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    PERSON_TYPEHASH,
                    keccak256(bytes(_person.name)),
                    _person.wallet
                )
            );
    }

    function generateDigest(Mail memory mail) public pure returns (bytes32) {
        bytes32 domainSeparator = GET_EIP712DOMAIN_PACKETHASH();
        bytes32 messageHash = GET_MAIL_PACKETHASH(mail);

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, messageHash)
        );

        return digest;
    }

    function recoverAddress(Mail memory mail, bytes memory signature)
        external
        pure
        returns (address)
    {
        bytes32 digest = generateDigest(mail);
        return recover(digest, signature);
    }
}
