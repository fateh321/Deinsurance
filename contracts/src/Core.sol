// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/IEvent.sol";
import "./Event.sol";
import "./libraries/TransferHelper.sol";

/** 
 * @title Core
 * @dev Implements the basic functionality of the insurance platform
 */
contract Core {

    struct EventStruct {
        bytes32 name; // the name of the insurance event
        uint duration;  // the duration of the insurance contract
        address eventAddress; // the address of the smart contract implementing the event
    }

    struct Proposal {
        // If you can limit the length to a certain number of bytes, 
        // always use one of bytes1 to bytes32 because they are much cheaper
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }

    address public owner;

    EventStruct[] public events;

    /** 
     * @dev Sets the owner of the contract
     */
    constructor() {
        owner = msg.sender;
    }

    /** 
     * @dev Enable entities to provide insurnace for some event
     * @param eventAddress the event for which insurance is provided
     * @param token the token in which insurance is ptrovided in
     * @param amount the amount if the provided insurance
     */
    function provideInsurance(address eventAddress, address token, uint amount) external {
        // require(
        //     msg.sender == chairperson,
        //     "Only chairperson can give right to vote."
        // );
        // require(
        //     !voters[voter].voted,
        //     "The voter already voted."
        // );
        // require(voters[voter].weight == 0);
        // !!!! make checks because now they can transfer to any address, not only events !!!!
        TransferHelper.safeTransferFrom(token, msg.sender, eventAddress, amount);
        IEvent(eventAddress).updateInsurance(msg.sender, token);
    }

    /** 
     * @dev Enable entities to purchase insurnace for some event
     * @param eventAddress the event for which insurance is being purchased
     * @param token the token in which insurance is bought in
     * @param premium the premium of insurance
     */
    function pruchaseInsurance(address eventAddress, address token, uint premium) external {
        // require(
        //     msg.sender == chairperson,
        //     "Only chairperson can give right to vote."
        // );
        // require(
        //     !voters[voter].voted,
        //     "The voter already voted."
        // );
        // require(voters[voter].weight == 0);
        // !!!! make checks because now they can transfer to any address, not only events !!!!
        TransferHelper.safeTransferFrom(token, msg.sender, eventAddress, premium);
        IEvent(eventAddress).updatePremiums(msg.sender, token);
    }

    /**
     * @dev Create a new insurance contract for a specific event
     * @param _name a name desrcibing the event
     * @param _duration the duration of teh contract in seconds
     * @param _oracleAddress the oracle that provided information on the status of the event
     */
    function createEvent(bytes32 _name, uint _duration, address _oracleAddress) external {
        bytes memory bytecode = type(Event).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_name, _duration, _oracleAddress));
        address eventAddress;
        assembly {
            eventAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        //IUniswapV2Pair(pair).initialize(token0, token1);
        
        events.push(EventStruct({
            name: _name,
            duration: _duration,
            eventAddress: eventAddress
        }));
        //emit EventCreated(name, eventAddress, events.length);
    }
}