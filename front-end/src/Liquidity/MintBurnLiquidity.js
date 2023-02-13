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
    getReserves, getOptionBalanceAndSymbol, stake, withdraw, trigger, mint, burn, redeem
} from "../ethereumFunctions";
import CoinField from "../CoinSwapper/CoinField";
import CoinDialog from "../CoinSwapper/CoinDialog";
import LoadingButton from "../Components/LoadingButton";
import SplitButton from "../Components/SplitButton";
import InputField from "./components/InputField";
import InputDialog from "../CoinSwapper/InputDialog";
import * as COINS from "../constants/coins";
import {symbol} from "prop-types";
import HorizontalLinearStepper from "./components/Stepper";
import * as EVENTS from "../constants/events";

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

function MintBurnLiquid(props) {
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
        "0x1FbF370cd78dB6023a29471a9B81E81C615601Dd"
    );

    // Stores a record of whether their respective dialog window is open
    const [dialog1Open, setDialog1Open] = React.useState(false);
    const [dialog2Open, setDialog2Open] = React.useState(false);
    const [dialog3Open, setDialog3Open] = React.useState(false);

    const [activeStep, setActiveStep] = React.useState(0);

    // Stores the current value of their respective text box
    const [field1Value, setField1Value] = React.useState("");
    const [field2Value, setField2Value] = React.useState("");
    const [field3Value, setField3Value] = React.useState("");
    const [field4Value, setField4Value] = React.useState("");


    // Controls the loading button
    const [loading, setLoading] = React.useState(false);
    // Stores data about their respective inputs to fetch correct event
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

    const [balances, setBalances] = React.useState({
        insurance: undefined,
        insuranceSysmbol: undefined,
        coverage: undefined,
        coverageSymbol: undefined,
  });


    // These functions take an HTML event, pull the data out and puts it into a state variable.
    const handleChange = {
        field1: (e) => {
            setField1Value(e.target.value);
        },

            field4: (e) => {
                setField4Value(e.target.value);
                setActiveStep(4);
            },

    };

    // Turns the account's balance into something nice and readable
    const formatBalance = (balance, symbol) => {
        console.log(symbol, balance)
        if (balance && symbol)
            return parseFloat(balance).toPrecision(8) + " " + symbol;
        else return "0.0";
    };

    // Turns the coin's reserves into something nice and readable
    // const formatReserve = (reserve, symbol) => {
    //     if (reserve && symbol) return reserve + " " + symbol;
    //     else return "0.0";
    // };

    // Determines whether the button should be enabled or not
    // const isButtonEnabled = () => {
    //     let validFloat = new RegExp("^[0-9]*[.,]?[0-9]*$");
    //
    //     // If both coins have been selected, and a valid float has been entered which is less than the user's balance, then return true
    //     return (
    //         coin1.address &&
    //         coin2.address &&
    //         validFloat.test(field1Value) &&
    //         parseFloat(field1Value) <= coin1.balance
    //     );
    // };

    // Called when the dialog window for input1 exits

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
            console.log("inaa:", inp[2][0]);
            setEventAddress(inp[2][0]);
            //setExchangeAddress(inp[2][1]);
            setActiveStep(3);
        }

    };

    const mintOption = () => {
        console.log("Attempting to stake...");
        console.log(provider);
        console.log(signer.getAddress());
        setLoading(true);

        mint(
            parseFloat(field4Value),
            coreAddress,
            eventAddress,
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
    const burnOption = () => {
        console.log("Attempting to stake...");
        console.log(provider);
        console.log(signer.getAddress());
        setLoading(true);

        burn(
            parseFloat(field4Value),
            coreAddress,
            eventAddress,
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
    const redeemOption = () => {
        console.log("Attempting to stake...");
        console.log(provider);
        console.log(signer.getAddress());
        setLoading(true);

        redeem(
            parseFloat(field4Value),
            coreAddress,
            eventAddress,
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

    // The lambdas within these useEffects will be called when a particular dependency is updated. These dependencies
    // are defined in the array of variables passed to the function after the lambda expression. If there are no dependencies
    // the lambda will only ever be called when the component mounts. These are very useful for calculating new values
    // after a particular state change, for example, calculating the new exchange rate whenever the addresses
    // of the two coins change.

    // This hook is called when either of the state variables `coin1.address` or `coin2.address` change.
    // This means that when the user selects a different coin to convert between, or the coins are swapped,
    // the new reserves will be calculated.
    // useEffect(() => {
    //     console.log(
    //         "Trying to get Reserves between:\n" + option1.address + "\n" + option2.address
    //     );
    //
    //     if (option1.address) {
    //         getReserves(option1.address, option2.address, eventAddress, signer, account).then(
    //             (data) => setReserves(data)
    //         );
    //     }
    // }, [option1.address, option2.address, account, factory, router, signer]);

    // This hook is called when either of the state variables `field1Value` `coin1.address` or `coin2.address` change.
    // It attempts to calculate and set the state variable `field2Value`
    // This means that if the user types a new value into the conversion box or the conversion rate changes,
    // the value in the output box will change.
    // useEffect(() => {
    //     if (isNaN(parseFloat(field1Value))) {
    //         setField2Value("");
    //     } else if (reserves[0] && reserves[1]) {
    //         if (option2.isInsurer){
    //             setField2Value(`${100*reserves[1]/reserves[0]}%`);
    //         }else{
    //             setField2Value(`${100*reserves[0]/reserves[1]}%`);
    //
    //         }
    //
    //         // getAmountOut(coin1.address, coin2.address, field1Value, router).then(
    //         //   (amount) => setField2Value(amount.toFixed(7))
    //         // );
    //     } else {
    //         setField2Value("");
    //     }
    // }, [field1Value, coin1.address, coin2.address]);

    // This hook creates a timeout that will run every ~10 seconds, it's role is to check if the user's balance has
    // updated has changed. This allows them to see when a transaction completes by looking at the balance output.
    useEffect(() => {
        const coinTimeout = setTimeout(() => {
            console.log("Checking balances...");
    //
    //         if (option1.address) {
    //             getReserves(
    //                 option1.address,
    //                 coin2.address,
    //                 eventAddress,
    //                 signer,
    //                 account
    //             ).then((data) => setReserves(data));
    //         }
    //
    //         if (option1.address) {
    //             getOptionBalanceAndSymbol(option2.isInsurer, account, eventAddress, provider, signer).then(
    //                 (data) => {
    //                     setOption2({
    //                         isCoin: false,
    //                         isInsurer: option2.isInsurer,
    //                         address: undefined,
    //                         symbol: option2.symbol,
    //                         balance: data.balance,
    //                     });
    //                 }
    //             );
    //         }
            if (account) {
                getBalanceAndSymbol(account, eventAddress, provider, signer).then(
                    (data) => {
                        setBalances({
                            insurance: data.balances[0],
                            insuranceSymbol: data.symbols[0],
                            coverage: data.balances[1],
                            coverageSymbol: data.symbols[1]
                        });
                    }
                );
            }
        }, 5000);
    
        return () => clearTimeout(coinTimeout);
    });

    // This hook will run when the component first mounts, it can be useful to put logic to populate variables here
    useEffect(() => {
        getAccount().then((account) => {
            setAccount(account);
        });
    });

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

            {/* Manage insurance box */}
            <Container maxWidth="sm">
                <Paper className={classes.paperContainer}>
                    <Typography variant="h5" className={classes.title}>
                        How you doin today?
                    </Typography>

                    <Grid container direction="column" alignItems="center" spacing={2}>
                        <Grid item xs={12} className={classes.fullWidth}>
                            <CoinField
                                activeField={true}
                                value={field1Value}
                                onClick={() => setDialog1Open(true)}
                                placeholder={"Select Oracle Id"}
                                symbol={input1.isSelected !== false ? "Done" : "Select"}
                            />
                        </Grid>


                        <Grid item xs={12} className={classes.fullWidth}>
                            <CoinField
                                activeField={true}
                                value={field2Value}
                                onClick={() => setDialog2Open(true)}
                                placeholder={"Select asset"}
                                symbol={input2.isSelected !== false ? "Done" : "Select"}
                            />
                        </Grid>

                        <Grid item xs={12} className={classes.fullWidth}>
                            <CoinField
                                activeField={true}
                                value={field3Value}
                                onClick={() => setDialog3Open(true)}
                                placeholder={"Select deadline"}
                                symbol={input3.isSelected !== false ? "Done" : "Select"}
                            />
                        </Grid>
                        <Grid item xs={12} className={classes.fullWidth}>
                            <InputField
                                activeField={true}
                                value={field4Value}
                                onClick={() => setDialog3Open(true)}
                                onChange={handleChange.field4}
                                placeholder={"Enter amount $"}
                            />
                        </Grid>

                        <hr className={classes.hr} />

                        {/* Balance Display */}
                        <Typography variant="h6">Your Balances</Typography>

                        <Typography variant="body1" className={classes.balance}>
                            {formatBalance(balances.insurance, balances.insuranceSymbol)}
                            <br/>                      
                            {formatBalance(balances.coverage, balances.coverageSymbol)}
                        </Typography>



                        <hr className={classes.hr} />

                        <SplitButton
                            onClick={[mintOption, burnOption, redeemOption, burnOption]}
                            options = {['Mint','Burn','Redeem','Provide Liquidity']}
                        >

                        </SplitButton>

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
                    @Becoz-we-can labs
                </p>
            </Grid>
        </div>
    );
}

export default MintBurnLiquid;
