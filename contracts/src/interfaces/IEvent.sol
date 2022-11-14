// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IEvent {
    function triggger() external returns (bool);
    function updateInsurance(address, address) external;
    function updatePremiums(address, address) external;
    function getBalances() external view returns (uint, uint);
}