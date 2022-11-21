import React, { useEffect } from "react";
import {
  Container,
  Grid,
  IconButton,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import SwapVerticalCircleIcon from "@material-ui/icons/SwapVerticalCircle";
import { useSnackbar } from "notistack";
import LoopIcon from "@material-ui/icons/Loop";
import AlarmIcon from "@material-ui/icons/Alarm";
import {
  getAccount,
  getFactory,
  getProvider,
  getRouter,
  getCore,
  getEvent,
  getSigner,
  getAmountOut,
  getBalanceAndSymbol,
  getWeth,
  swapTokens,
  getReserves, getOptionBalanceAndSymbol, stake, withdraw, trigger, buy, sell
} from "../ethereumFunctions";
import CoinField from "./CoinField";
import CoinDialog from "./CoinDialog";
import InputDialog from "./InputDialog";
import LoadingButton from "../Components/LoadingButton";
import SplitButton from "../Components/SplitButton";
import InputField from "../Liquidity/components/InputField";
import * as COINS from "../constants/coins";
import * as EVENTS from "../constants/events";
import {symbol} from "prop-types";
import HorizontalLinearStepper from "./Stepper";

const styles = (theme) => ({
  paperContainer: {
    borderRadius: theme.spacing(2),
    padding: theme.spacing(1),
    paddingBottom: theme.spacing(3),
    backgroundColor: '#dfe1f5'
  },
  switchButton: {
    zIndex: 1,
    margin: "-16px",
    padding: theme.spacing(0.5),
  },
  fullWidth: {
    width: "100%",
  },
  title: {
    textAlign: "center",
    padding: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  hr: {
    width: "100%",
  },
  balance: {
    padding: theme.spacing(1),
    overflow: "wrap",
    textAlign: "center",
  },
  footer: {
    marginTop: "285px",
  },
});

const useStyles = makeStyles(styles);

function CoinSwapper(props) {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

  // Stores information for the insurance smart contracts

  const [provider, setProvider] = React.useState(getProvider());
  const [signer, setSigner] = React.useState(getSigner(provider));
  const [account, setAccount] = React.useState(undefined); // This is populated in a react hook

  const [coreAddress, setCoreAddress] = React.useState(
    "0xde68D58ba403be67703B903c99932A854A233dEF"
  );
  const [eventAddress, setEventAddress] = React.useState(
    "0x"
  );
  const [exchangeAddress, setExchangeAddress] = React.useState(
      "0x"
  );
  const [weth, setWeth] = React.useState(
    getWeth("0x3f0D1FAA13cbE43D662a37690f0e8027f9D89eBF", signer)
  );


  // Stores a record of whether their respective dialog window is open
  const [dialog1Open, setDialog1Open] = React.useState(false);
  const [dialog2Open, setDialog2Open] = React.useState(false);
  const [dialog3Open, setDialog3Open] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);
  //TODO

  // Stores data about their respective input

  const [input1, setInput1] = React.useState({
    isSelected: false,
    index: undefined,
    name: undefined,
  });

  const [input2, setInput2] = React.useState({
    isSelected: false,
    index: undefined,
    name: undefined,
  });

  const [input3, setInput3] = React.useState({
    isSelected: false,
    index: undefined,
    name: undefined,
  });
  // Stores the current reserves in the liquidity pool between coin1 and coin2
  const [reserves, setReserves] = React.useState(["0.0", "0.0"]);

  // Stores the current value of their respective text box
  const [field1Value, setField1Value] = React.useState("");
  const [field2Value, setField2Value] = React.useState("");
  const [field3Value, setField3Value] = React.useState("");
  const [field4Value, setField4Value] = React.useState("");

  // Controls the loading button
  const [loading, setLoading] = React.useState(false);

  // These functions take an HTML event, pull the data out and puts it into a state variable.
  const handleChange = {
    field4: (e) => {
      setField4Value(e.target.value);
      setActiveStep(4);
    },
  };

  // Turns the account's balance into something nice and readable
  // const formatBalance = (balance, symbol) => {
  //   if (balance && symbol)
  //     return parseFloat(balance).toPrecision(8) + " " + symbol;
  //   else return "0.0";
  // };
  //
  // // Turns the coin's reserves into something nice and readable
  // const formatReserve = (reserve, symbol) => {
  //   if (reserve && symbol) return reserve + " " + symbol;
  //   else return "0.0";
  // };

  // Determines whether the button should be enabled or not
  // const isButtonEnabled = () => {
  //   let validFloat = new RegExp("^[0-9]*[.,]?[0-9]*$");
  //
  //   // If both coins have been selected, and a valid float has been entered which is less than the user's balance, then return true
  //   return (
  //     coin1.address &&
  //     coin2.address &&
  //     validFloat.test(field1Value) &&
  //     parseFloat(field1Value) <= coin1.balance
  //   );
  // };

  const onInput1Selected = (inp) => {
    // Close the dialog window
    setDialog1Open(false);

    // We only update the values if the user provides a token

    // Getting some token data is async, so we need to wait for the data to return, hence the promise
    if (inp !== undefined) {
      setInput1(
          {
            isSelected: true,
            name: inp[0],
            index: inp[1],
          }
      );
      setField1Value(
          "Oracle: "+inp[0]
      )
      setActiveStep(1);
    }

  };
  const onInput2Selected = (inp) => {
    // Close the dialog window
    setDialog2Open(false);

    // We only update the values if the user provides a token

    // Getting some token data is async, so we need to wait for the data to return, hence the promise
    if (inp !== undefined) {
      setInput2(
          {
            isSelected: true,
            name: inp[0],
            index: inp[1],
          }
      );
      setField2Value(
         "Asset: " +inp[0]
      )
      setActiveStep(2);
    }

  };

  const onInput3Selected = (inp) => {
    // Close the dialog window
    setDialog3Open(false);

    // We only update the values if the user provides a token

    // Getting some token data is async, so we need to wait for the data to return, hence the promise
    if (inp !== undefined) {
      setInput3(
          {
            isSelected: true,
            name: inp[0],
            index: inp[1],
          }
      );
      setField3Value(
          "Deadline: "+inp[0]
      )
      setEventAddress(inp[2].event);
      setExchangeAddress(inp[2].exchnge);
      setActiveStep(3);
    }

  };

  const buyOption = () => {
    console.log("Attempting to stake...");
    console.log(provider);
    console.log(signer.getAddress());
    setLoading(true);

    buy(
        parseFloat(field4Value),
        exchangeAddress,
        signer
    )
        .then(() => {
          setLoading(false);

          // If the transaction was successful, we clear to input to make sure the user doesn't accidental redo the transfer
          setField1Value("");
          enqueueSnackbar("Transaction Successful", { variant: "success" });
        })
        .catch((e) => {
          setLoading(false);
          enqueueSnackbar("Transaction Failed (" + e.message + ")", {
            variant: "error",
            autoHideDuration: 10000,
          });
        });
  };
  const sellOption = () => {
    console.log("Attempting to stake...");
    console.log(provider);
    console.log(signer.getAddress());
    setLoading(true);

    sell(
        parseFloat(field1Value),
        exchangeAddress,
        signer
    )
        .then(() => {
          setLoading(false);

          // If the transaction was successful, we clear to input to make sure the user doesn't accidental redo the transfer
          setField1Value("");
          enqueueSnackbar("Transaction Successful", { variant: "success" });
        })
        .catch((e) => {
          setLoading(false);
          enqueueSnackbar("Transaction Failed (" + e.message + ")", {
            variant: "error",
            autoHideDuration: 10000,
          });
        });
  };


  const triggerOption = () => {
    console.log("Attempting to trigger...");
    setLoading(true);

    trigger(
        coreAddress,
        eventAddress,
        signer
    )
        .then(() => {
          setLoading(false);
          enqueueSnackbar("Transaction Successful", { variant: "success" });
        })
        .catch((e) => {
          setLoading(false);
          enqueueSnackbar("Transaction Failed (" + e.message + ")", {
            variant: "error",
            autoHideDuration: 10000,
          });
        });
  };


  // The lambdas within these useEffects will be called when a particular dependency is updated. These dependencies
  // are defined in the array of variables passed to the function after the lambda expression. If there are no dependencies
  // the lambda will only ever be called when the component mounts. These are very useful for calculating new values
  // after a particular state change, for example, calculating the new exchange rate whenever the addresses
  // of the two coins change.

  // This hook is called when either of the state variables `coin1.address` or `coin2.address` change.
  // This means that when the user selects a different coin to convert between, or the coins are swapped,
  // the new reserves will be calculated.
  // useEffect(() => {
  //   console.log(
  //     "Trying to get Reserves between:\n" + option1.address + "\n" + option2.address
  //   );
  //
  //   if (option1.address) {
  //     getReserves(option1.address, option2.address, eventAddress, signer, account).then(
  //       (data) => setReserves(data)
  //     );
  //   }
  // }, [option1.address, option2.address, account, factory, router, signer]);

  // This hook is called when either of the state variables `field1Value` `coin1.address` or `coin2.address` change.
  // It attempts to calculate and set the state variable `field2Value`
  // This means that if the user types a new value into the conversion box or the conversion rate changes,
  // the value in the output box will change.
  // useEffect(() => {
  //   if (isNaN(parseFloat(field1Value))) {
  //     setField2Value("");
  //   } else if (reserves[0] && reserves[1]) {
  //     if (option2.isInsurer){
  //       setField2Value(`${100*reserves[1]/reserves[0]}%`);
  //     }else{
  //       setField2Value(`${100*reserves[0]/reserves[1]}%`);
  //
  //     }
  //
  //     // getAmountOut(coin1.address, coin2.address, field1Value, router).then(
  //     //   (amount) => setField2Value(amount.toFixed(7))
  //     // );
  //   } else {
  //     setField2Value("");
  //   }
  // }, [field1Value, coin1.address, coin2.address]);

  // This hook creates a timeout that will run every ~10 seconds, it's role is to check if the user's balance has
  // updated has changed. This allows them to see when a transaction completes by looking at the balance output.
  // useEffect(() => {
  //   const coinTimeout = setTimeout(() => {
  //     console.log("Checking balances...");
  //
  //     if (option1.address) {
  //       getReserves(
  //         option1.address,
  //         coin2.address,
  //         eventAddress,
  //         signer,
  //         account
  //       ).then((data) => setReserves(data));
  //     }
  //
  //     if (option1.address) {
  //       getOptionBalanceAndSymbol(option2.isInsurer, account, eventAddress, provider, signer).then(
  //         (data) => {
  //                   setOption2({
  //                     isCoin: false,
  //                     isInsurer: option2.isInsurer,
  //                     address: undefined,
  //                     symbol: option2.symbol,
  //                     balance: data.balance,
  //                   });
  //         }
  //       );
  //     }
  //     if (coin2 && account) {
  //       getBalanceAndSymbol(account, coin2.address, provider, signer).then(
  //         (data) => {
  //           setCoin2({
  //             ...coin2,
  //             balance: data.balance,
  //           });
  //         }
  //       );
  //     }
  //   }, 5000);
  //
  //   return () => clearTimeout(coinTimeout);
  // });
  //
  // // This hook will run when the component first mounts, it can be useful to put logic to populate variables here
  // useEffect(() => {
  //   getAccount().then((account) => {
  //     setAccount(account);
  //   });
  // });

  return (
    <div>
      <HorizontalLinearStepper
      activeStep = {activeStep}
      />
      {/* Dialog Windows */}
      <InputDialog
        open={dialog1Open}
        onClose={onInput1Selected}
        events={EVENTS.ALLEVENTS}
        signer={signer}
        heading = {"Select Oracle ID"}
        isPasteAddress = {false}
      />
      <InputDialog
        open={dialog2Open}
        onClose={onInput2Selected}
        events={input1.isSelected ? EVENTS.ALLEVENTS[input1.index].array : []}
        signer={signer}
        heading = {"Select asset"}
        isPasteAddress = {false}
      />
      <InputDialog
          open={dialog3Open}
          onClose={onInput3Selected}
          events={input2.isSelected ? EVENTS.ALLEVENTS[input1.index].array[input2.index].array : []}
          signer={signer}
          heading = {"Select deadline"}
          isPasteAddress = {false}
      />

      {/* insurance marketplace */}
      <Container maxWidth="sm" >
        <Paper className={classes.paperContainer} >
          <Typography variant="h5" className={classes.title}>
            How you doin today?
          </Typography>

          <Grid container direction="column" alignItems="center" spacing={2}  >
            <Grid item xs={12} className={classes.fullWidth}>
              <CoinField
                activeField={true}
                value={field1Value}
                onClick={() => setDialog1Open(true)}
                placeholder={"Select Oracle Id"}
                // symbol={coin1.symbol !== undefined ? coin1.symbol : "Select"}
                symbol={input1.isSelected !== false ? "Done" : "Select"}
              />
            </Grid>

            <Grid item xs={12} className={classes.fullWidth}>
              <CoinField
                activeField={true}
                value={field2Value}
                onClick={() => setDialog2Open(true)}
                placeholder={"Select asset"}
                // symbol={coin2.symbol !== undefined ? coin2.symbol : "Select"}
                symbol={input2.isSelected !== false ? "Done" : "Select"}
              />
            </Grid>

            <Grid item xs={12} className={classes.fullWidth}>
              <CoinField
                  activeField={true}
                  value={field3Value}
                  onClick={() => setDialog3Open(true)}
                  placeholder={"Select deadline"}
                  // symbol={coin2.symbol !== undefined ? coin2.symbol : "Select"}
                  symbol={input3.isSelected !== false ? "Done" : "Select"}
              />
            </Grid>
            <Grid item xs={12} className={classes.fullWidth}>
              <InputField
                  activeField={true}
                  value={field4Value}
                  onChange={handleChange.field4}
                  onClick={() => setDialog3Open(true)}
                  placeholder={"Enter premium $"}
              />
            </Grid>

            <hr className={classes.hr} />

            {/* Balance Display */}
            <Typography variant="h6">Fetching coverage</Typography>

                <Typography variant="body1" className={classes.balance}>
                  TODO
                  {/*{formatBalance(option2.balance, option1.symbol)}*/}
                </Typography>


            <hr className={classes.hr} />

            {/* Reserves Display */}
            {/*we don't need to */}
            {/*<Typography variant="h6">Reserves</Typography>*/}

            {/*<Grid container direction="row" justifyContent="space-between">*/}
            {/*  <Grid item xs={6}>*/}
            {/*    <Typography variant="body1" className={classes.balance}>*/}
            {/*      {formatReserve(reserves[0], option1.symbol!==undefined ? `${option1.symbol} insuring` : "")}*/}
            {/*    </Typography>*/}
            {/*  </Grid>*/}
            {/*  <Grid item xs={6}>*/}
            {/*    <Typography variant="body1" className={classes.balance}>*/}
            {/*      {formatReserve(reserves[1], option1.symbol!==undefined ? `${option1.symbol} insured` : "")}*/}
            {/*    </Typography>*/}
            {/*  </Grid>*/}
            {/*</Grid>*/}


            <SplitButton
            onClick={[buyOption, sellOption]}
            options = {['Buy', 'Sell']}
            >

            </SplitButton>
            <hr className={classes.hr} />

              <Grid item xs={6}>
                <LoadingButton
                    loading={loading}
                    valid={true}
                    success={false}
                    fail={false}
                    onClick={triggerOption}
                >
                  <AlarmIcon />
                  Trigger
                </LoadingButton>
              </Grid>

          </Grid>
        </Paper>
      </Container>

      <Grid
        container
        className={classes.footer}
        direction="row"
        justifyContent="center"
        alignItems="flex-end"
      >
        <p>
          @Becoz-we-can klabs
        </p>
      </Grid>
    </div>
  );
}

export default CoinSwapper;
