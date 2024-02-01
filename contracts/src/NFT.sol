// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract NFT is ERC721, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    uint256 public NFT_MAX_SUPPLY = 1111;
    uint256 public NFT_PRICE = 0.05 ether;
    uint256 public NFTS_PER_MINT = 20;
    string private _contractURI;
    string private _tokenBaseURI;
    string public _mysteryURI;
    uint256 public currentBalance = address(this).balance;
    address private withdrawAddress;
    bool public revealed = false;
    bool public saleLive = false;
    bool public giftLive = false;

    Counters.Counter private supply;

    constructor(string memory tokenBaseUri, string memory mysteryURI, address _withdrawAddress, string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        _tokenBaseURI = tokenBaseUri;
        _mysteryURI = mysteryURI;
        withdrawAddress = _withdrawAddress;
    }

    modifier mintCompliance(uint256 _mintAmount) {
        require(supply.current() < NFT_MAX_SUPPLY, "OUT_OF_STOCK");
        require(
            supply.current() + _mintAmount <= NFT_MAX_SUPPLY,
            "EXCEED_STOCK"
        );
        require(_mintAmount <= NFTS_PER_MINT, "EXCEED_NFTS_PER_MINT");
        _;
    }

    function mintGiftAsOwner(uint256 tokenQuantity, address wallet)
        external
        onlyOwner
        mintCompliance(tokenQuantity)
    {
        require(giftLive, "GIFTING_CLOSED");
        _mintLoop(wallet, tokenQuantity);
    }

    function mint(uint256 tokenQuantity)
        external
        payable
        mintCompliance(tokenQuantity)
    {
        require(saleLive, "SALE_CLOSED");
        require(msg.value >= NFT_PRICE * tokenQuantity, "INSUFFICIENT_ETH");
        require(msg.sender != owner(), "Owner can not mint an NFT");
        _mintLoop(msg.sender, tokenQuantity);
    }

    function _mintLoop(address _receiver, uint256 _mintAmount) internal {
        for (uint256 i = 0; i < _mintAmount; i++) {
            supply.increment();
            _safeMint(_receiver, supply.current());
        }
    }

    function totalSupply() public view returns (uint256) {
        return supply.current();
    }

    function withdraw() external onlyOwner {
        // payable(owner()).transfer(currentBalance);
        (bool os, ) = payable(withdrawAddress).call{
            value: address(this).balance
        }("");
        require(os);
    }

    function toggleSaleStatus() external onlyOwner {
        saleLive = !saleLive;
    }

    function toggleSaleGiftStatus() external onlyOwner {
        giftLive = !giftLive;
    }

    function toggleReveal() public onlyOwner {
        revealed = !revealed;
    }

    function setNftsPerMint(uint256 quantity) public onlyOwner {
        NFTS_PER_MINT = quantity;
    }

    function setWithdrawAddress(address _newWithdrawAddress) public onlyOwner {
        withdrawAddress = _newWithdrawAddress;
    }

    function setMysteryURI(string calldata URI) public onlyOwner {
        _mysteryURI = URI;
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function setPriceOfNFT(uint256 price) external onlyOwner {
        // 70000000000000000 = .07 eth
        NFT_PRICE = price;
    }

    function setNFTMax(uint256 max) external onlyOwner {
        NFT_MAX_SUPPLY = max;
    }

    function setContractURI(string calldata URI) external onlyOwner {
        _contractURI = URI;
    }

    function setBaseURI(string calldata URI) external onlyOwner {
        _tokenBaseURI = URI;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721)
        returns (string memory)
    {
        require(_exists(tokenId), "Cannot query non-existent token");

        if (revealed == false) {
            return _mysteryURI;
        }

        return
            string(
                abi.encodePacked(_tokenBaseURI, tokenId.toString(), ".json")
            );
    }

    function fromBoolToString(bool _data) public pure returns (string memory) {
        if (_data == true) {
            return "true";
        } else {
            return "false";
        }
    }

    function getContractValuesInObject() public view returns (string memory) {
        return
            string(
                bytes(
                    abi.encodePacked(
                        '{"saleLive":"',
                        fromBoolToString(saleLive),
                        '", "revealed":"',
                        fromBoolToString(revealed),
                        '", "giftLive":"',
                        fromBoolToString(giftLive),
                        '", "Supply":"',
                        currentSupply(),
                        '", "mysteryURI":"',
                        _mysteryURI,
                        '","NFT_PRICE":"',
                        NFT_PRICE.toString(),
                        '", "NFT_MAX_SUPPLY":"',
                        NFT_MAX_SUPPLY.toString(),
                        '", "NFTS_PER_MINT":"',
                        NFTS_PER_MINT.toString(),
                        '" }'
                    )
                )
            );
    }

    function currentSupply() public view returns (string memory) {
        return supply.current().toString();
    }
}