// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

interface IOracle {
    function query() external returns (uint score); // not a view function, can further call other functions.
}