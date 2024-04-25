import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { formatNumberWithSign } from '../utils/utils.js'

export default function Cart({ selected_event_id, selected_outcome, odds }: any) {
    // console.log("prev: " + prev_odds_a);
    // console.log("curr: " + curr_odds_a);

    const [venmoUsername, setVenmoUsername] = useState();
    const [wagerAmount, setWagerAmount] = useState();
    const [isReallyProcessing, setIsReallyProcessing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleVenmoUsernameChange = (event: any) => {
        setVenmoUsername(event.target.value);
    };

    const handleWagerAmountChange = (event: any) => {
        setWagerAmount(event.target.value);
    };

    function isValidWagerAmount(wagerAmount: any) {
        const moneyRegex = /^\d+(\.\d{2})?$/;
        return moneyRegex.test(wagerAmount) && wagerAmount >= 1 && wagerAmount <= 10;
    }

    function isValidVenmoUsername(venmoUsername: any) {
        const usernameRegex = /^[a-zA-Z0-9_-]{5,30}$/;
        return venmoUsername && usernameRegex.test(venmoUsername);
    }

    function calculatePayout(wagerAmount: any, odds: any) {
        let payout;
        if (odds > 0) {
            payout = (odds / 100.0) * wagerAmount;
        } else {
            payout = (100.0 / Math.abs(odds)) * wagerAmount;
        }

        return Math.abs(payout).toFixed(2);
    }

    const submitWager = async () => {
        setIsReallyProcessing(true);
        try {
            let queryUrl = `http://localhost:8000/api/place_wager?event_id=${selected_event_id}&outcome=${selected_outcome}&venmo_username=${venmoUsername}&wager_amount=${wagerAmount}`;
            const response = await axios.get(queryUrl);
            setIsReallyProcessing(false);
            return response.data;
        } catch (error) {
            console.error("Error:", error);
            setIsReallyProcessing(false);
            return {};
        }
    };

    useEffect(() => {
        if (isReallyProcessing == true) {
            setIsProcessing(true);
        } else {
            setTimeout(() => {
                setIsProcessing(false);
            }, 2500);
        }
    }, [isReallyProcessing]);

    return (
        <div className="cart">
            <p className="text-[#888] text-xs mb-1">MAX WAGER: $10</p>
            <div className="flex justify-between font-semibold">
                <p>{selected_outcome}</p>
                <p>{formatNumberWithSign(odds)}</p>
            </div>
            <div className="mt-3 flex justify-between">
                <div className="" style={{
                    minHeight: 55,
                }}>
                    <input
                        type="text"
                        value={venmoUsername}
                        onChange={handleVenmoUsernameChange}
                        placeholder="Venmo Username"
                        className="cart_input"
                    />
                    <input
                        type="text"
                        value={wagerAmount}
                        onChange={handleWagerAmountChange}
                        placeholder="Wager Amount ($)"
                        className="cart_input ml-4"
                    />
                </div>
                <div
                    className={isValidVenmoUsername(venmoUsername) && isValidWagerAmount(wagerAmount) ? `submit_enabled` : `submit_disabled`}
                    onClick={() => {
                        if (!isProcessing && isValidVenmoUsername(venmoUsername) && isValidWagerAmount(wagerAmount)) {
                            submitWager();
                        }
                    }}
                >
                    {isProcessing &&
                        <div className="mt-[6px]">
                            <div className="h-5 w-5 border-t-transparent border-solid animate-spin rounded-full border-white border-4"></div>
                        </div>
                    }

                    {!isProcessing &&
                        < p className="text-md font-semibold">
                            Submit
                        </p>
                    }

                    {!isProcessing && isValidVenmoUsername(venmoUsername) && isValidWagerAmount(wagerAmount) &&
                        <p className="text-xs">
                            TO WIN: ${calculatePayout(wagerAmount, odds)}
                        </p>
                    }
                </div>
            </div>
        </div >
    );
};