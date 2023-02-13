import * as React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import LoopIcon from "@material-ui/icons/Loop";
import {CircularProgress, makeStyles} from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import Box from "@mui/material/Box";
import ListItemText from '@mui/material/ListItemText';
// const options = ['Buy', 'Sell'];

const useStyles = makeStyles((theme) => ({
    wrapper: {
        margin: 0,
        position: "relative",
    },
    progress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
}));
export default function SplitButton(props) {
    const {onClick, options, ...other} = props;
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const handleClick = () => (
        onClick[selectedIndex]()
        // onClickArray[selectedIndex]
        // console.info(`You clicked ${options[selectedIndex]}`)
);

    const handleMenuItemClick = (event, index) => {
        setSelectedIndex(index);
        setOpen(false);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        setOpen(false);
    };

    return (
        <React.Fragment>
            <ButtonGroup variant="contained" ref={anchorRef} /*aria-label="split button"*/>
                <Button
                    color="primary"
                    size="medium"
                    onClick={handleClick}
                >
                    <LoopIcon />
                    {options[selectedIndex]}

                </Button>

                <Button
                    size="small"
                    color="primary"
                    aria-controls={open ? 'split-button-menu' : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label="select action"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{
                    zIndex: 1,
                }}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        {/*<Box display="block">*/}
                        <Paper
                            variant={"elevation"}
                            sx={{ width: 140 }}
                        >
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu" autoFocusItem dense>
                                    {options.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            // divider='true'
                                            // disableGutters='true'
                                            // disabled={index === 2}
                                            selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                            sx={{ 
                                                '&.MuiButtonBase-root': {
                                                  display: 'flex',
                                                },
                                            }}
                                        >
                                            <ListItemText sx={{ ml:4}}> {option} </ListItemText>
                                        </MenuItem>
                                    ))}

                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                        {/*</Box>*/}
                    </Grow>
                )}
            </Popper>
        </React.Fragment>
    );
}