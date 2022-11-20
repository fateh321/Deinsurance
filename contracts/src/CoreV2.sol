// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts@4.8.0/access/Ownable.sol";

import "./interfaces/IEvent.sol";
import "./Event.sol";
import "./libraries/TransferHelper.sol";

/** 
 * @title Core
 * @dev Implements the core functionality of the insurance protocol
 */
contract Core is Ownable{

    // struct EventStruct {
    //     bytes32 name; // the name of the insurance event
    //     uint duration;  // the duration of the insurance contract
    //     address eventAddress; // the address of the smart contract implementing the event
    // }

    //address private owner;
    bool public coreStatus; //the freeze status of the core contract; no insurance related actions are possible; contracts can still be triggered
    bool public platformStatus; //the freeze status of the whole platform; contracts cannot be triggered
//    EventStruct[] public events; //not needed, address provided by user

    // /** 
    //  * @dev Sets the owner of the contract
    //  */
    // constructor() {
    //     owner = msg.sender;
    // }

    /** 
     * @dev Enable entities to give assets in return for insurance tokens
     * @param eventAddress the event for which assets are provided
     * @param amount the amount of the provided asset
     */
    function mintPositions(address eventAddress, uint amount) external {
        require(!platformStatus, "Insurance platfom is freezed; method currently unavailable.");
        require(!coreStatus, "Core contract is freezed; method currently unavailable.");
            
        Event evt = Event(eventAddress);
        require(!evt.dormant(), "Contract is dormant; no longer possible to mint.");

        address token = evt.asset();

        TransferHelper.safeTransferFrom(token, msg.sender, eventAddress, amount); //sender only needs to authorize the Core contract
        evt.mint(msg.sender);
    }

    /** 
     * @dev Enable entities to get insurnace tokens for some event
     * @param eventAddress the event for which insurance is provided
     * @param amount the amount if the provided insurance
     */
    function burnPositions(address eventAddress, uint amount) external {
        require(!platformStatus, "Insurance platfom is freezed; method currently unavailable.");
        require(!coreStatus, "Core contract is freezed; method currently unavailable.");
            
        Event evt = Event(eventAddress);
        require(!evt.dormant(), "Contract is dormant; no longer possible to burn.");

        // address insuredToken = evt.insuredToken();
        // address providerToken = evt.providerToken();

        //ideally these are called only by the owner (event), o/w tokens can be destroyed without
        //changing the totalAsset counter of the event and without returning the asset to the user.
        //Although, becasue of this, they have no incentive for doing it. Unless someone is messing.
        // insuredToken.burnFrom(msg.sender, amount*10);
        // providerToken.burnFrom(msg.sender, amount*10);
        //!!!!!!!!!!!!!!!!!!
        
        evt.returnAsset(msg.sender, amount);

    }

    /** 
     * @dev Enable entities to get insurnace tokens for some event
     * @param eventAddress the event for which insurance is provided
     */
    function redeemPositions(address eventAddress) external {
        // require(!platformStatus, "Insurance platfom is freezed; method currently unavailable.");
        // require(!coreStatus, "Core contract is freezed; method currently unavailable.");
            
        Event evt = Event(eventAddress);
        require(evt.dormant(), "Contract is not dormant; not possible to redeem yet.");

        address token = evt.asset();

        TransferHelper.safeTransferFrom(token, msg.sender, eventAddress, amount);
        evt.updateInsurance(msg.sender);

    }

    /**
     * @dev Create a new insurance contract for a specific event
     * @param _name a name desrcibing the event
     * @param _duration the duration of teh contract in seconds
     * @param _oracleAddress the oracle that provided information on the status of the event
     * @param _assetAddress the token representing the staked asset
     * @param _settleRatio the ratio of assets between the insurance providing and purchasing sides
     */
    function deployEvent(bytes32 _name, uint _duration, address _oracleAddress, address _assetAddress, uint _settleRatio) external returns (address eventAddress) {
        bytes memory bytecode = type(Event).creationCode;
        bytes32 _salt = keccak256(abi.encodePacked(_name, _duration, _oracleAddress, _assetAddress, _settleRatio));
        eventAddress = new Event{salt: _salt}(_name, _duration, _oracleAddress, _assetAddress, _settleRatio);
                
        // events.push(EventStruct({
        //     name: _name,
        //     duration: _duration,
        //     eventAddress: eventAddress
        // }));
        //emit EventDeployed(_name, _eventAddress, _oracleAddress, _assetAddress, _duration); //should we instead make a different request directly
        //to the eventAddress to find out oracel, asset, and duration?
    }

    function setCoreStatus(bool status) external onlyOwner {
        coreStatus = status;
    }

    function setPlatformStatus(bool status) external onlyOwner {
        platformStatus = status;
    }

    function setEventStatus(bool status, address eventAddress) external onlyOwner {
        Event evt = Event(eventAddress);
        evt.setEventStatus(status);
    }
}