// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/IEvent.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IERC20.sol";

/**
 * @title Event
 * @dev A contract representing an insurance event for which people can provide or buy insurance
 */
contract Event is IEvent {

    address private owner; // the onwer of the event (the Core contract of the platform)
    bytes32 public name; //the name of the insurance event
    uint public duration; //the duration of the insurance contract in seconds
    address public oracleAddress; // the address of the oracle contract that gives information on the satus of the event

    uint public deadline; // the expiration time of the contract
    mapping(address => uint) public insurers; // the individual contribution of each insurance provider
    mapping(address => uint) public insured; //the premius paid by each individual insured (insuree??) for this event
    uint totalInsurance; // the total insurance provided for this event
    uint totalPremiums; // the sum of the premiums paid by the insured for this event
    uint totalFunds; // the total number of funds for this event to be distributed at the expiration of this contarct
    bool triggerSuccessful; // whether a trigger was succesful and funds must be distributed

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
    constructor(bytes32 _name, uint _duration, address _oracleAddress) {
        name = _name;
        duration = _duration;
        oracleAddress = _oracleAddress;

        owner = msg.sender;
        deadline = block.timestamp + duration;
        totalInsurance = 0;
        totalPremiums = 0;
        totalFunds = 0;
        triggerSuccessful = false;
    }

    /**
     * @dev Trigger the activation of the contract in order to distribute funds
     * @return whether the trigger was successful: event has occured or deadline has expired
     */
    function triggger() external override returns (bool) {
        bool oracleOutcome = true; // ONLY for testing; IOracle(oracleAddress).query();
        totalFunds = totalInsurance + totalPremiums;

        if (oracleOutcome) {
            totalInsurance = 0;
            triggerSuccessful = true;
            return true;
        }
        else {
            require(block.timestamp >= deadline, "Contract expiration date has not been reached yet.");
            totalPremiums = 0;
            triggerSuccessful = true;
            return true;
        }
    }

    /**
     * @dev Updates the insurance funds
     * @param insurer the address of the entity provding insurance
     * @param token the token in which insurance is provided in
     */
    function updateInsurance(address insurer, address token) external override {
        uint amount = IERC20(token).balanceOf(address(this)) - (totalInsurance + totalPremiums);
        totalInsurance += amount;
        insurers[insurer] += amount;
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
            totalInsurance == 0 ? insurance = 0 : insurance = insurers[msg.sender]/totalInsurance*totalFunds;
            totalPremiums == 0 ? premiums = 0 : premiums = insured[msg.sender]/totalPremiums*totalFunds;
        }
        else {
            insurance = insurers[msg.sender];
            premiums = insured[msg.sender];
        }
    }
} 