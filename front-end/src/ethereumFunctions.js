import { Contract, ethers } from "ethers";
import * as COINS from "./constants/coins";
import * as ADDRS from "./constants/events";
const ROUTER = require("./build/UniswapV2Router02.json");
const ERC20 = require("./build/ERC20.json");
const FACTORY = require("./build/IUniswapV2Factory.json");
const PAIR = require("./build/IUniswapV2Pair.json");
const EVENT = require("./build/DeInsurance/Event.json");
const CORE = require("./build/DeInsurance/Core_v2.json");
const INSTOKEN = require("./build/DeInsurance/InsuranceToken");

export function getProvider() {
  return new ethers.providers.Web3Provider(window.ethereum);
}

export function getSigner(provider) {
  return provider.getSigner();
}

export function getRouter(address, signer) {
  return new Contract(address, ROUTER.abi, signer);
}

export function getCore(address, signer) {
  return new Contract(address, CORE.abi, signer);
}

export function getEvent(address, signer) {
  return new Contract(address, EVENT.abi, signer);
}

export function getWeth(address, signer) {
  return new Contract(address, ERC20.abi, signer);
}

export function getFactory(address, signer) {
  return new Contract(address, FACTORY.abi, signer);
}

export async function getAccount() {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  return accounts[0];
}

//This function checks if a ERC20 token exists for a given address
//    `address` - The Ethereum address to be checked
//    `signer` - The current signer
export function doesTokenExist(address, signer) {
  try {
    return new Contract(address, ERC20.abi, signer);
  } catch (err) {
    return false;
  }
}

// This function returns an object with 2 fields: `balance` which container's the account's balance in the particular token,
// and `symbol` which is the abbreviation of the token name. To work correctly it must be provided with 4 arguments:
//    `accountAddress` - An Ethereum address of the current user's account
//    `address` - An Ethereum address of the token to check for (either a token or AUT)
//    `provider` - The current provider
//    `signer` - The current signer
export async function getBalanceAndSymbol(
  accountAddress,
  eventAddress,
  provider,
  signer
) {
  console.log("Checking balances for real now");
  console.log(accountAddress);
  console.log(eventAddress);
  //try {
    const event = new Contract(eventAddress, EVENT.abi, signer);
    const insuranceTokenAddress = event.insuredToken();
    const providerTokenAddress = event.providerToken();

    let token = new Contract(insuranceTokenAddress, INSTOKEN.abi, signer);
    const insuranceBalanceRaw = await token.balanceOf(accountAddress);
    const insuranceSymbol = await token.symbol();

    token =  new Contract(providerTokenAddress, INSTOKEN.abi, signer);
    const providerBalanceRaw = await token.balanceOf(accountAddress);
    const providerSymbol = await token.symbol();

    console.log("balance: ", ethers.utils.formatEther(insuranceBalanceRaw), insuranceSymbol);
    return {
      balances: [ethers.utils.formatEther(insuranceBalanceRaw), ethers.utils.formatEther(providerBalanceRaw)],
      symbols: [insuranceSymbol, providerSymbol]
    };
  //} catch (err) {
 //   return false;
 // }
}
// the following function fetches the balance of user as an insurer and insured.
export async function getOptionBalanceAndSymbol(
    isInsurer,
    accountAddress,
    eventAddress,
    provider,
    signer
) {
  console.log("fetching coverage for real now");
  //try {
      console.log("fetching coverage for real now");
      console.log(eventAddress);
      const event = new Contract(eventAddress, EVENT.abi, signer);

      const settleRatio = (await event.refundPerecent()).toNumber()/100; //settleRatio is x100 in the contract to ease Solidity division
      const assetTokenRatio = (await event.assetTokenRatio()).toNumber();

      const insuranceRedemptionPrice = (1 - settleRatio) / assetTokenRatio;
      const coverageRedemptionPrice = settleRatio / assetTokenRatio;
     
      const insuranceToken = await event.insuredToken();
      const insuranceUniPool = await (new Contract(ADDRS.UNISWAP.factory, FACTORY.abi, signer)).getPair(insuranceToken, ADDRS.WETH.address);
      const reserves = await (new Contract(insuranceUniPool, PAIR.abi, signer).getReserves());
      const insurancePrice = reserves[0]/reserves[1];

      const reward = insurancePrice - insuranceRedemptionPrice + 0.001; //from whitepaper
      const coverage = (2*coverageRedemptionPrice - 1 / assetTokenRatio)/reward;

      console.log("settle ratio: ", settleRatio);
      console.log("redemption price: ", insuranceRedemptionPrice);
      console.log("insuance price: ", insurancePrice);
      console.log("reward: ", reward);
      console.log("coverage: ", coverage);

      return {
        coverage: coverage,
      };

      // const symbol = "";//await token.symbol();
      // // should return based on whether the staker is insurer or insured
      // if(isInsurer){
      //   return {
      //     balance: ethers.utils.formatEther(balances[0]),
      //     symbol: symbol,
      //   };
      // }else{
      //   return {
      //     balance: ethers.utils.formatEther(balances[1]),
      //     symbol: symbol,
      //   };
      // }

  // } catch (err) {
  //   console.log("fetching coverage for real now-part 2");
  //   return false;
  // }
}
// This function swaps two particular tokens / AUT, it can handle switching from AUT to ERC20 token, ERC20 token to AUT, and ERC20 token to ERC20 token.
// No error handling is done, so any issues can be caught with the use of .catch()
// To work correctly, there needs to be 7 arguments:
//    `address1` - An Ethereum address of the token to trade from (either a token or AUT)
//    `address2` - An Ethereum address of the token to trade to (either a token or AUT)
//    `amount` - A float or similar number representing the value of address1's token to trade
//    `routerContract` - The router contract to carry out this trade
//    `accountAddress` - An Ethereum address of the current user's account
//    `signer` - The current signer
export async function swapTokens(
  address1,
  address2,
  amount,
  routerContract,
  accountAddress,
  signer
) {
  const tokens = [address1, address2];
  const time = Math.floor(Date.now() / 1000) + 200000;
  const deadline = ethers.BigNumber.from(time);

  const amountIn = ethers.utils.parseEther(amount.toString());
  const amountOut = await routerContract.callStatic.getAmountsOut(
    amountIn,
    tokens
  );

  const token1 = new Contract(address1, ERC20.abi, signer);
  await token1.approve(routerContract.address, amountIn);

  if (address1 === COINS.AUTONITY.address) {
    // Eth -> Token
    await routerContract.swapExactETHForTokens(
      amountOut[1],
      tokens,
      accountAddress,
      deadline,
      { value: amountIn }
    );
  } else if (address2 === COINS.AUTONITY.address) {
    // Token -> Eth
    await routerContract.swapExactTokensForETH(
      amountIn,
      amountOut[1],
      tokens,
      accountAddress,
      deadline
    );
  } else {
    await routerContract.swapExactTokensForTokens(
      amountIn,
      amountOut[1],
      tokens,
      accountAddress,
      deadline
    );
  }
}
// this function is supposed to be used to buy or provide insurance cover
export async function stake(
    isInsurer,
    tokenAddress,
    amount,
    coreAddress,
    eventAddress,
    signer
) {
  console.log(eventAddress);
  console.log(tokenAddress);
  // const tokens = [address1, address2];
  const time = Math.floor(Date.now() / 1000) + 200000;
  const deadline = ethers.BigNumber.from(time);

  const amountIn = ethers.utils.parseEther(amount.toString());
   console.log(amountIn);
  // const amountOut = await routerContract.callStatic.getAmountsOut(
  //     amountIn,
  //     tokens
  // );
  console.log("stake1");
  //const token = new Contract(tokenAddress, ERC20.abi, signer);
  console.log("stake2");
  //await token.approve(coreAddress, amountIn);
  console.log("stake3");

  const coreContract = new Contract(coreAddress, CORE.abi, signer);
  console.log("stake4");

  if (isInsurer){
    console.log("stake5");
    await coreContract.provideInsurance(
        eventAddress,
        tokenAddress,
        amountIn
    )
    console.log("stake5a");
  }else{
    console.log("stake6");
    await coreContract.pruchaseInsurance(
        eventAddress,
        tokenAddress,
        amountIn
    )
    console.log("stake6a");
  }

}

// this function is supposed to mint tokens
export async function mint(
    amount,
    coreAddress,
    eventAddress,
    signer
) {
  console.log(eventAddress);

  const time = Math.floor(Date.now() / 1000) + 200000;
  const deadline = ethers.BigNumber.from(time);

  const amountIn = ethers.utils.parseEther(amount.toString());
  console.log(amountIn);
  // const amountOut = await routerContract.callStatic.getAmountsOut(
  //     amountIn,
  //     tokens
  // );

  console.log("stake3");

  const coreContract = new Contract(coreAddress, CORE.abi, signer);
  console.log("stake4");

    await coreContract.mintPositions(
        eventAddress,
        amountIn
    )
    console.log("stake5a");

}
// this function is supposed to burn tokens
export async function burn(
    amount,
    coreAddress,
    eventAddress,
    signer
) {
  console.log(eventAddress);

  const time = Math.floor(Date.now() / 1000) + 200000;
  const deadline = ethers.BigNumber.from(time);

  const amountIn = ethers.utils.parseEther(amount.toString());
  console.log(amountIn);
  // const amountOut = await routerContract.callStatic.getAmountsOut(
  //     amountIn,
  //     tokens
  // );

  console.log("stake3");

  const coreContract = new Contract(coreAddress, CORE.abi, signer);
  console.log("stake4");

  await coreContract.burnPositions(
      eventAddress,
      amountIn
  )
  console.log("stake5a");

}
// this function is supposed to burn tokens
export async function redeem(
    coreAddress,
    eventAddress,
    signer
) {
  console.log(eventAddress);

  const time = Math.floor(Date.now() / 1000) + 200000;
  const deadline = ethers.BigNumber.from(time);


  console.log("stake3");

  const coreContract = new Contract(coreAddress, CORE.abi, signer);
  console.log("stake4");

  await coreContract.redeemPositions(
      eventAddress
  )
  console.log("stake5a");

}
// this function is supposed to buy insured tokens
export async function buy(
    amount,
    eventUniAddress,
    signer
) {

  const time = Math.floor(Date.now() / 1000) + 200000;
  const deadline = ethers.BigNumber.from(time);

  const amountIn = ethers.utils.parseEther(amount.toString());
  console.log(amountIn);
  // const amountOut = await routerContract.callStatic.getAmountsOut(
  //     amountIn,
  //     tokens
  // );

  console.log("stake3");

  const uniContract = new Contract(eventUniAddress, CORE.abi, signer);
  console.log("stake4");

  await uniContract.swap(
      amountIn
  )
  console.log("stake5a");

}
// this function is supposed to sell tokens
export async function sell(
    amount,
    eventUniAddress,
    signer
) {

  const time = Math.floor(Date.now() / 1000) + 200000;
  const deadline = ethers.BigNumber.from(time);

  const amountIn = ethers.utils.parseEther(amount.toString());
  console.log(amountIn);
  // const amountOut = await routerContract.callStatic.getAmountsOut(
  //     amountIn,
  //     tokens
  // );

  console.log("stake3");

  const uniContract = new Contract(eventUniAddress, CORE.abi, signer);
  console.log("stake4");

  await uniContract.swap(
      amountIn
  )
  console.log("stake5a");

}
export async function trigger(
    coreAddress,
    eventAddress,
    signer
) {
  const event = new Contract(eventAddress, EVENT.abi, signer);
  const result = await event.triggger(true);
}

export async function deployEvent(
    name,
    duration,
    oracleAddress,
    assetAddress,
    settleRatio,
    tokenRatio,
    coreAddress,
    signer
) {
  // const _duration = BigInt(duration.toString());
  // const _settleRatio = BigInt(settleRatio.toString());
  // const _tokenRatio = BigInt(tokenRatio.toString());
  const coreContract= new Contract(coreAddress, CORE.abi, signer);
  const result = await coreContract.deployEvent(name, duration, oracleAddress, assetAddress, settleRatio, tokenRatio);
}
export async function withdraw(
    isInsurer,
    tokenAddress,
    amount,
    coreAddress,
    eventAddress,
    signer
) {
  const dummy = 3;
}

//This function returns the conversion rate between two token addresses
//    `address1` - An Ethereum address of the token to swaped from (either a token or AUT)
//    `address2` - An Ethereum address of the token to swaped to (either a token or AUT)
//    `amountIn` - Amount of the token at address 1 to be swaped from
//    `routerContract` - The router contract to carry out this swap
export async function getAmountOut(
  address1,
  address2,
  amountIn,
  routerContract
) {
  try {
    const values_out = await routerContract.getAmountsOut(
      ethers.utils.parseEther(amountIn),
      [address1, address2]
    );
    const amount_out = ethers.utils.formatEther(values_out[1]);
    return Number(amount_out);
  } catch {
    return false;
  }
}

// This function calls the pair contract to fetch the reserves stored in a the liquidity pool between the token of address1 and the token
// of address2. Some extra logic was needed to make sure that the results were returned in the correct order, as
// `pair.getReserves()` would always return the reserves in the same order regardless of which order the addresses were.
//    `address1` - An Ethereum address of the token to trade from (either a ERC20 token or AUT)
//    `address2` - An Ethereum address of the token to trade to (either a ERC20 token or AUT)
//    `pair` - The pair contract for the two tokens
export async function fetchReserves(address1, address2, pair) {
  try {
    const reservesRaw = await pair.getReserves();
    let results = [
      Number(ethers.utils.formatEther(reservesRaw[0])),
      Number(ethers.utils.formatEther(reservesRaw[1])),
    ];

    return [
      (await pair.token0()) === address1 ? results[0] : results[1],
      (await pair.token1()) === address2 ? results[1] : results[0],
    ];
  } catch (err) {
    console.log("no reserves yet");
    return [0, 0];
  }
}

// this function is supposed to fetch the total stakes
export async function fetchStakes(pair) {
  try {
    const reservesRaw = await pair.getReserves();
    let results = [
      Number(ethers.utils.formatEther(reservesRaw[0])),
      Number(ethers.utils.formatEther(reservesRaw[1])),
    ];

    return results;
  } catch (err) {
    console.log("no reserves yet");
    return [0, 0];
  }
}
// This function returns the reserves stored in a the liquidity pool between the token of address1 and the token
// of address2, as well as the liquidity tokens owned by accountAddress for that pair.
//    `address1` - An Ethereum address of the token to trade from (either a token or AUT)
//    `address2` - An Ethereum address of the token to trade to (either a token or AUT)
//    `factory` - The current factory
//    `signer` - The current signer
export async function getReserves(
  address1,
  address2,
  eventAddress,
  signer,
  accountAddress
) {
  console.log("Reserves");
//  const pairAddress = await factory.getPair(address1, address2);
  const event = new Contract(eventAddress, EVENT.abi, signer);

  let insurance = await event.totalInsurance();
  let premiums = await event.totalPremiums();
  insurance = ethers.utils.formatEther(insurance);
  premiums = ethers.utils.formatEther(premiums);
  console.log(insurance);
  console.log(premiums);
  if (insurance === "0.0") {
    premiums = "0.0";
  }
//  const liquidityTokens_BN = await pair.balanceOf(accountAddress);
//  const liquidityTokens = Number(
//    ethers.utils.formatEther(liquidityTokens_BN)
//  ).toFixed(2);

  return [
    insurance,//.toFixed(2),
    premiums,//.toFixed(2),
    0,//liquidityTokens,
  ];
}
