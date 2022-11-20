// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

//import "@openzeppelin/contracts@4.8.0/utils/Math.sol";
import "@openzeppelin/contracts@4.8.0/access/Ownable.sol";

import "./interfaces/IEvent.sol";
import "./interfaces/IOracle.sol";
//import "./interfaces/IERC20.sol";
import "./InsuranceToken.sol";
import "./libraries/TransferHelper.sol";

/**
 * @title Event
 * @dev A contract representing an insurance event for which people can provide or buy insurance
 */
contract Event is IEvent, Ownable {

    string public name; //the name of the insurance event
    uint public duration; //the duration of the insurance contract in seconds
    address public oracleAddress; // the address of the oracle contract that gives information on the satus of the event
    address public asset; // the token representing the staked asset
    uint public refundPerecent; //the percentage of the insurance assets refunded to providers or insurers when no coverage is needd and when it is respectively
    uint public assetTokenRatio; //how much one asset token is worth in terms of insurance tokens

    uint public deadline; // the expiration time of the contract
    mapping(address => uint) public insurers; // the individual contribution of each insurance provider
    mapping(address => uint) public insured; //the premius paid by each individual insured (insuree??) for this event
    InsuranceToken public providerToken; //the token rewarding the insurance providers when event doesn't require coverage
    InsuranceToken public insuredToken; //the token providing insurance to holders in case an insurance event manifests
    uint public totalInsurance = 0; // the total insurance provided for this event
    uint public totalPremiums = 0; // the sum of the premiums paid by the insured for this event
    uint insuredModifier = 0; // the perecentage of the total insurance assets that will go to insured users after contract expiration
    uint providerModifier = 0; //the percentage of the total insurance assets that will go to the insurance providers after contract expiration
    uint public totalAsset = 0; // the total number of funds for this event to be distributed at the expiration of this contarct
    bool public triggerSuccessful = false; // whether a trigger was succesful and funds must be distributed
    bool public dormant = false; // state of the contract; turns true by freeze of trigger

    // event for EVM logging
    // event EventOccured(bytes32 name);
    // event DeadlineExpired(bytes32 name);

    /**
     * @dev Initialized the insurance event with the suitable values
     */
    constructor(string memory _name, uint _duration, address _oracleAddress, address _assetAddress, uint _refundPercent) {
        require(_refundPercent >= 50 && _refundPercent <= 100, "Refund precent must be between 50 and 100");
        name = _name;
        duration = _duration;
        oracleAddress = _oracleAddress;
        asset = _assetAddress;
        refundPerecent = _refundPercent;

        deadline = block.timestamp + duration;
        _deployInsuranceTokens();
    //     totalInsurance = 0;
    //     totalPremiums = 0;
    //     totalFunds = 0;
    //     triggerSuccessful = false;
    }

    function _deployInsuranceTokens() private {
        //bytes memory bytecode = type(InsuranceToken).creationCode;
        
        bytes32 saltProvider = keccak256(abi.encodePacked(name, "Provider", "EVP")); //must make sure salt is unique for each token
        bytes32 saltInsurance = keccak256(abi.encodePacked(name, "Insurance", "EVI"));
        
        providerToken = new InsuranceToken{salt: saltProvider}(string(abi.encodePacked(name, "Provider")), "EVP"); //use encodePacked to concat strings; hack; replace
        insuredToken = new InsuranceToken{salt: saltInsurance}(string(abi.encodePacked(name, "Insurance")), "EVI");
    }

    /**
     * @dev Updates the insurance funds and mints new insurance tokens
     * @param to the address providing the assets and the recepient of the insurance tokens
     */
    function mint(address to) external override onlyOwner {
        //amount is calculated here, so function couldn't be called on its own externally
        //permanantely fixed by onlyOwner modifier
        uint amount = IERC20(asset).balanceOf(address(this)) - totalAsset; //(totalInsurance + totalPremiums);
        totalAsset += amount;
        InsuranceToken(insuredToken).mint(to, amount*assetTokenRatio);
        InsuranceToken(providerToken).mint(to, amount*assetTokenRatio);
    }

    function returnAsset(address to, uint amount) external override onlyOwner{
        //uint amount = 0;//.... - InsuranceToken(insuredToken).balanceOf(to);

        //insuredToken.ownerBurn(msg.sender, amount*assetTokenRatio);
        //providerToken.ownerBurn(msg.sender, amount*assetTokenRatio);

        totalAsset -= amount;
        TransferHelper.safeTransferFrom(asset, address(this), to, amount);
    }

    /**
     * @dev Trigger the activation of the contract in order to distribute funds. Successful only if contract is not dormant.
     * @return whether the trigger was successful: event has occured or deadline has expired
     */
    function trigger() external override returns (bool) {
        require(!this.dormant(), "Contract is dormant; no longer possible to trigger it.");
        //bool oracleOutcome = outcome; // ONLY for testing;
        bool oracleOutcome = IOracle(oracleAddress).query();

        if (oracleOutcome) {
            insuredModifier = refundPerecent;
            providerModifier = 10 - refundPerecent;
            dormant = true;
            return true;
        }
        else {
            require(block.timestamp >= deadline, "Contract expiration date has not been reached yet.");
            insuredModifier = 100 - refundPerecent;
            providerModifier = refundPerecent;
            dormant = true;
            return true;
        }
    }



    // function getBalances() external view override returns (uint insurance, uint premiums) {
    //     if (triggerSuccessful) {
    //         totalInsurance == 0 ? insurance = 0 : insurance = totalFunds*insurers[msg.sender]/totalInsurance;
    //         totalPremiums == 0 ? premiums = 0 : premiums = totalFunds*insured[msg.sender]/totalPremiums;
    //     }
    //     else {
    //         insurance = insurers[msg.sender];
    //         premiums = insured[msg.sender];
    //     }
    // }

    // function claimInsurance() external override { //moved to core: reedemPositions
    //     insurers[msg.sender] = 0;
    //     insured[msg.sender] = 0;
    //     triggerSuccessful = false;
    // }

    function setEventStatus(bool status) external onlyOwner {
        dormant = status;
    }
} 