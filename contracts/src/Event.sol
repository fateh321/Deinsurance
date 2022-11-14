// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/IEvent.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IERC20.sol";
import "./InsuranceToken.sol";

/**
 * @title Event
 * @dev A contract representing an insurance event for which people can provide or buy insurance
 */
contract Event is IEvent {

    //CHANGE TO PRIVATE!!
    address public owner; // the onwer of the event (the Core contract of the platform)
    bytes32 public name; //the name of the insurance event
    uint public duration; //the duration of the insurance contract in seconds
    address public oracleAddress; // the address of the oracle contract that gives information on the satus of the event
    address public asset; // the token representing the staked asset
    uint public settleRatio; //the ratio of assets between the insurance providing and purchasing sides

    uint public deadline; // the expiration time of the contract
    mapping(address => uint) public insurers; // the individual contribution of each insurance provider
    mapping(address => uint) public insured; //the premius paid by each individual insured (insuree??) for this event
    address providerToken; //the token rewarding the insurance providers when event doesn't require coverage
    address insuredToken; //the token providing insurance to holders in case an insurance event manifests
    uint public totalInsurance = 0; // the total insurance provided for this event
    uint public totalPremiums = 0; // the sum of the premiums paid by the insured for this event
    uint public totalAsset = 0; // the total number of funds for this event to be distributed at the expiration of this contarct
    bool public triggerSuccessful = false; // whether a trigger was succesful and funds must be distributed
    bool public dormant = false; // state of the contract; turns true by freeze of trigger

    // event for EVM logging
    // event EventOccured(bytes32 name);
    // event DeadlineExpired(bytes32 name);

    // modifier to check if caller is owner
    modifier isOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    /**
     * @dev Initialized the insurance event with the suitable values
     */
    constructor(bytes32 _name, uint _duration, address _oracleAddress, address _assetAddress, uint _settleRatio) {
        name = _name;
        duration = _duration;
        oracleAddress = _oracleAddress;
        asset = _assetAddress;
        settleRatio = _settleRatio;

        owner = msg.sender;
        deadline = block.timestamp + duration;
        _deployInsuranceTokens();
    //     totalInsurance = 0;
    //     totalPremiums = 0;
    //     totalFunds = 0;
    //     triggerSuccessful = false;
    }

    function _deployInsuranceTokens() private {
        bytes memory bytecode = type(InsuranceToken).creationCode;
        
        bytes32 saltProvider = keccak256(abi.encodePacked(name+"Provider", "EVP")); //must make sure salt is unique for each token
        bytes32 saltInsurance = keccak256(abi.encodePacked(name+"Insurance", "EVI"));
        
        providerToken = new InsuranceToken{salt: saltProvider}(name+"Provider", "EVP");
        insuredToken = new InsuranceToken{salt: saltInsurance}(name+"Insurance", "EVI");
        }
    }

    /**
     * @dev Updates the insurance funds and mints new insurance tokens
     * @param to the address providing the assets and the recepient of the insurance tokens
     */
    function mint(address to) external override {
        //amount is calculated here, so function cannot be called on its own externally
        uint amount = IERC20(asset).balanceOf(address(this)) - totalAsset; //(totalInsurance + totalPremiums);
        totalAsset += amount;
        InsuranceToken(insuredToken).mint(to, amount*10); //magic number; make it arg to constructor
        InsuranceToken(providerToken).mint(to, amount*10);
    }

    function returnAsset(address to) external override {
        uint amount = .... - InsuranceToken(insuredToken).balanceOf(to);

        totalAsset -= amount;
        TransferHelper.safeTransferFrom(asset, address(this), msg.sender, amount);
    }

    /**
     * @dev Trigger the activation of the contract in order to distribute funds. Successful only if contract is not dormant.
     * @return whether the trigger was successful: event has occured or deadline has expired
     */
    function trigger(bool outcome) external override returns (bool) {
        require(!this.dormant, "Contract is dormant; no longer possible to trigger it.");
        bool oracleOutcome = outcome; // ONLY for testing; IOracle(oracleAddress).query();
        totalFunds = totalInsurance + totalPremiums;

        if (oracleOutcome) {
            insuredModifier = 0.9; //no decimals available; make it correct
            providerModifier = 0.1;
            return true;
        }
        else {
            require(block.timestamp >= deadline, "Contract expiration date has not been reached yet.");
            insurerModifier = 0.1;
            providerModifier = 0.9;
            return true;
        }
        dormant = true;
    }



     /**
     * @dev Updates the premium funds
     * @param _insured the address of the entity buying insurance
     * @param token the token in which premium is provided in
     */
    function updatePremiums(address _insured, address token) external override {
        uint premium = IERC20(token).balanceOf(address(this)) - (totalInsurance + totalPremiums);
        totalPremiums += premium;
        insured[_insured] += premium;
    }

    function getBalances() external view override returns (uint insurance, uint premiums) {
        if (triggerSuccessful) {
            totalInsurance == 0 ? insurance = 0 : insurance = totalFunds*insurers[msg.sender]/totalInsurance;
            totalPremiums == 0 ? premiums = 0 : premiums = totalFunds*insured[msg.sender]/totalPremiums;
        }
        else {
            insurance = insurers[msg.sender];
            premiums = insured[msg.sender];
        }
    }

    function claimInsurance() external override { //moved to core: reedemPositions
        insurers[msg.sender] = 0;
        insured[msg.sender] = 0;
        triggerSuccessful = false;
    }
} 