// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/IEvent.sol";
import "./BackupERC20.sol";
import './interfaces/IERC20.sol';
import "./interfaces/IOracle.sol";
import './libraries/Math.sol';


/**
 * @title BackupEvent
 * @dev A contract representing a binary event with ERC20 cover and insurance tokens
 */
contract BackupEvent is IBackupEvent{
    using SafeMath  for uint;
    
    address public factory; //address of the factory
    uint public duration; //the duration of the contract until expiration
    address public oracleAddress; // the address of the oracle that gives current state of the event
    address public asset; // address of the ERC20 asset
    uint public settleRatioNum; // the fraction of assets in percentage points that will go to the loser (between 0 and 50)
    uint public assetTokenRatio; // number of cover and insurance tokens minted/burnt for each staked asset. Should be 1 to prevent over/underflow
    uint public deadline; // maximum/latest timestamp of the last valid block before deadline (considering PoS)
    BackupERC20 public coverERC20; // token representing cover positions held by insurance providers
    BackupERC20 public insuranceERC20; // token representing insurance positions held by insurance seekers
    uint public assetReserves; // total asset held by the contract
    uint public coverDebt; // total cover tokens owed to the contract
    uint public insuranceDebt; // total insurance tokens owed to the contract
    bool public triggerState = false; // tells the status of last trigger call (false by default)
    uint public redeemScore = 0; // always between 0 and 10. 0 represents no catastrophe, 10 means absolute catastrophe


    uint private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, 'UniswapV2: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }
     function _safeTransfer(address token,address to,uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'BackUp: TRANSFER_FAILED');
    }

    /**
     * @dev constructor for the event contract
     */
     constructor() public {
        factory = msg.sender;
    }

     // called once by the factory at time of deployment
    function initialize(uint _duration, address _oracleAddress, address _asset, uint _settleRatioNum) external {
        require(msg.sender == factory && _settleRatioNum <= 50, 'Backup: FORBIDDEN'); 
        /** 
         * TODO: confirm whether _settleRatioNum >= 0 is redundant
         * TODO: also check the parameter technique used in uniswap v-3 to borrow arguments
         */ 
        duration = _duration;
        oracleAddress = _oracleAddress;
        asset = _asset;
        settleRatioNum = _settleRatioNum;
        deadline = block.timestamp + duration;

        bytes saltCover = keccak256(abi.encodePacked("cover")); //make sure salt is unique for each token
        bytes saltInsurance = keccak256(abi.encodePacked("insurance"));
        coverERC20 = new BackupERC20{salt: saltCover}();
        insuranceERC20 = new BackupERC20{salt: saltInsurance}();
        /**
         * TODO add names to these tokens "cover & insurance". Also add event id.
         */

    }
    function _update(uint _coverDebt, uint _insuranceDebt, uint assetBalance)private{
        coverDebt = _coverDebt;
        insuranceDebt = _insuranceDebt;
        assetReserves = assetBalance;
        /**
         * 
         * TODO create a TWAP oracle for TVL
         */

    }
    /**
     * @dev function to mint cover and insurance positions.
     * @param to the recepient address of the cover and insurance tokens. 
     */
    function mintPosition(address to) external lock returns (uint amountOut){
        uint _assetReserves = assetReserves;
        uint assetBalance = IERC20(asset).balanceOf(address(this));
        amountOut = assetBalance.sub(_assetReserves).mul(assetTokenRatio);
        require(amountOut > 0, 'BackUp: INSUFFICIENT_POSITION_MINTED');
        BackupERC20(coverERC20).mint(to, amountOut);
        BackupERC20(insuranceERC20).mint(to, amountOut);
        uint _coverDebt = BackupERC20(coverERC20).totalSupply;
        uint _insuranceDebt = BackupERC20(insuranceERC20).totalSupply;
        /**
         * TODO: may be we don't need to store coverDebt and insuranceDebt.
         */
        _update(_coverDebt, _insuranceDebt, assetBalance);

    }

    function burnPosition(address to) external lock returns (uint assetOut){
        uint _coverBalance = BackupERC20(coverERC20).balanceOf(address(this));
        uint _insuranceBalance = BackupERC20(insuranceERC20).balanceOf(address(this));
        uint tokenBurn = Math.min(_coverBalance, _insuranceBalance);
        assetOut = assetTokenRatio.mul(tokenBurn);
        /**
         * TODO decide on asset token multiplication and fee
         */
        require(assetOut > 0, 'BackUp: INSUFFICIENT_POSITION_BURNED');
        IERC20(asset).transfer(to, assetOut);
        uint assetBalance = IERC20.balanceOf(asset);
        BackupERC20(coverERC20)._burn(address(this), tokenBurn);
        BackupERC20(insuranceERC20)._burn(address(this), tokenBurn);
        uint _coverDebt = BackupERC20(coverERC20).totalSupply;
        uint _insuranceDebt = BackupERC20(insuranceERC20).totalSupply;
        _update(_coverDebt, _insuranceDebt, assetBalance);
    }
    /**
     * If someone deposits extra asset by accident, they can mint and then burn to get their asset back.
     * If someone deposit cover or insurance token by accident and redeem is not on, they can skim it.
     * Also, need to double check that the invariant holds after every operation: assetBalance >= assetReserves >= k where k cover supply == insurance supply = k, or settleRatio*Loser Supply + (1-settleRatio)*winner supply
     */
    
    function skim(address to) external lock {
        address _coverERC20 = coverERC20;  // gas savings
        address _insuranceERC20 = insuranceERC20;
        BackupERC20(_coverERC20).transfer(to,BackupERC20(_coverERC20).balanceOf(address(this)));
        BackupERC20(_insuranceERC20).transfer(to,BackupERC20(_insuranceERC20).balanceOf(address(this)));
    }
    /**
     * Implement safe transfer.
     */

    function trigger() external lock returns (bool status){
        require(!triggerState, "BackUp: Trigger already successful");
        if (block.timestamp > deadline){
            triggerState = true;
        }else{
            uint oracleScore = IOracle.query();
            require(oracleScore =< 10, "BackUp: Invalid oracle score");
            if (oracleScore > redeemScore){
                redeemScore = oracleScore;
            }
            if (oracleScore==10){
                triggerState = true;
            }
        }
        status = triggerState;
    }

    function redeemCover(address to)external lock returns (uint assetOut){
        require(triggerState, "BackUp: wait until positive trigger");
        uint _coverBalance = BackupERC20(coverERC20).balanceOf(address(this));
        /**
         * Implement fee below
         */
        numerator = assetTokenRatio.mul(_coverBalance).mul(10.sub(redeemScore).mul(100.sub(settleRatioNum)).add(settleRatioNum.mul(redeemScore)));
        assetOut = numerator / 1000;
        if (assetOut > 0){
            IERC20(asset).transfer(to, assetOut);
        }
        BackupERC20(coverERC20)._burn(address(this), _coverBalance);
        uint assetBalance = IERC20.balanceOf(asset);
        uint _coverDebt = BackupERC20(coverERC20).totalSupply;
        uint _insuranceDebt = BackupERC20(insuranceERC20).totalSupply;
        _update(_coverDebt, _insuranceDebt, assetBalance);

    }

    function redeemInsurance(address to)external lock returns(uint assetOut) {
        uint _insuranceBalance = BackupERC20(insuranceERC20).balanceOf(address(this));
        /**
         * implement fee below
         */
        numerator = assetTokenRatio.mul(_insuranceBalance).mul(redeemScore.mul(100.sub(settleRatioNum)).add(settleRatioNum.mul(10.sub(redeemScore))));
        assetOut = numerator / 1000;
        if (assetOut > 0){
            IERC20(asset).transfer(to, assetOut);
        }
        BackupERC20(insuranceERC20)._burn(address(this), _insuranceBalance);
        uint assetBalance = IERC20.balanceOf(asset);
        uint _coverDebt = BackupERC20(coverERC20).totalSupply;
        uint _insuranceDebt = BackupERC20(insuranceERC20).totalSupply;
        _update(_coverDebt, _insuranceDebt, assetBalance);
    
    }

    /**
     * TODO: function to drain excess assets to feeTo address.
     */
}