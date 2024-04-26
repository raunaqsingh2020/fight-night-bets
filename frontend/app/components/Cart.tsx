import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../utils/supabase'

import { isMobile } from 'react-device-detect';

import { formatNumberWithSign } from '../utils/utils.js'

export default function Cart({ selected_event_id, selected_outcome, odds }: any) {
    // console.log("prev: " + prev_odds_a);
    // console.log("curr: " + curr_odds_a);

    // const [venmoUsername, setVenmoUsername] = useState();
    const [wagerAmount, setWagerAmount] = useState();
    const [isReallyProcessing, setIsReallyProcessing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // const handleVenmoUsernameChange = (event: any) => {
    //     setVenmoUsername(event.target.value);
    // };

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

    async function refetchSelectedOdd() {
        try {
            const { data: current_odds } = await supabase.from('current_odds').select().eq("event_id", selected_event_id);
            if (current_odds) {
                const outcome_odds = selected_outcome == current_odds[0].outcome_a ? current_odds[0].odds_a :
                    selected_outcome == current_odds[0].outcome_b ? current_odds[0].odds_b :
                        null;
                return outcome_odds;
            }
        } catch {
            return null;
        }

        return null;
    }

    async function getVenmoLink(isMobile: boolean) {
        if (!wagerAmount || wagerAmount < 1 || wagerAmount > 10)
            return null;

        const upToDateOdds = await refetchSelectedOdd();
        const payout = parseFloat(wagerAmount) + parseFloat(calculatePayout(wagerAmount, upToDateOdds));

        const formattedOdds = formatNumberWithSign(upToDateOdds);

        const venmo_username = "arham_habibi"; // TODO
        let comment = `${selected_outcome} (${formattedOdds}) - for: $${payout.toFixed(2)}`;
        comment = comment.replace("$", "%24");
        comment = comment.replace("+", "%2B");

        comment += `
        
        **Note: Lines can move, submit quickly! Final might be marginally different**`

        let link = isMobile ? "venmo://paycharge?" : "https://account.venmo.com/pay?";
        link += `txn=pay&recipients=${venmo_username}&note=${comment}&amount=${wagerAmount}`;

        return link
    }

    const submitWager = async () => {
        setIsReallyProcessing(true);
        try {
            // let queryUrl = `http://localhost:8000/api/place_wager?event_id=${selected_event_id}&outcome=${selected_outcome}&wager_amount=${wagerAmount}&is_mobile=${isMobile}`;
            // const response = await axios.get(queryUrl);
            // console.log(response.data)

            const venmoLink: string | null = await getVenmoLink(isMobile);
            if (venmoLink) {
                if (isMobile) {
                    window.location.href = venmoLink;
                } else {
                    var win = window.open(venmoLink, '_blank');
                    if (win)
                        win.focus();
                }
            }

            setIsReallyProcessing(false);
        } catch (error) {
            console.error("Error:", error);
            setIsReallyProcessing(false);
        }
    };

    useEffect(() => {
        if (isReallyProcessing == true) {
            setIsProcessing(true);
        } else {
            setTimeout(() => {
                setIsProcessing(false);
            }, 1000);
        }
    }, [isReallyProcessing]);

    return (
        <div className="cart">
            <p className="text-[#888] text-xs mb-1">MIN/MAX WAGER: $1-10</p>
            <div className="flex justify-between font-semibold">
                <p>{selected_outcome}</p>
                <p>{formatNumberWithSign(odds)}</p>
            </div>
            <div className="mt-3 flex justify-between">
                <div className="" style={{
                    minHeight: 55,
                }}>
                    {/* <input
                        type="text"
                        value={venmoUsername}
                        onChange={handleVenmoUsernameChange}
                        placeholder="Venmo Username"
                        className="cart_input"
                    /> */}
                    <input
                        type="text"
                        value={wagerAmount}
                        onChange={handleWagerAmountChange}
                        placeholder="Wager Amount ($)"
                        className="cart_input"
                    />
                </div>
                <div
                    className={isValidWagerAmount(wagerAmount) ? `submit_enabled` : `submit_disabled`}
                    onClick={() => {
                        if (!isProcessing && isValidWagerAmount(wagerAmount)) {
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

                    {!isProcessing && isValidWagerAmount(wagerAmount) &&
                        <p className="text-xs">
                            TO WIN: ${calculatePayout(wagerAmount, odds)}
                        </p>
                    }
                </div>
            </div>
        </div >
    );
};