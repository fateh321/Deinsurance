// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IEvent {
    function mint(address) external;
    function returnAsset(address, uint) external;
    function trigger() external returns (bool);
    function setEventStatus(bool) external;
}