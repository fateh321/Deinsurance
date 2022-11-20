// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/IOracle.sol";

/**
 * @title Oracle
 * @dev Provides information for a specific insurance event
 */
contract Oracle is IOracle{

    /**
     * @dev Event-specific code that characterizes the condtion for an event to happen
     * @return Whether the event has occured or not
     */
    function query() external pure override returns (bool) {
        /* Event-specific implementation code goes here */
        return false; 
    }
}