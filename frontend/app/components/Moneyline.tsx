import React from 'react';

import { formatNumberWithSign } from '../utils/utils.js'

export default function Moneyline({ outcome_a, outcome_b, curr_odds_a, curr_odds_b, prev_odds_a, prev_odds_b, select_outcome, selected_outcome }: any) {
    // console.log("prev: " + prev_odds_a);
    // console.log("curr: " + curr_odds_a);

    let outcome_a_class = "outcome";
    if (outcome_a == selected_outcome)
        outcome_a_class += " selected_outcome";

    let outcome_b_class = "outcome";
    if (outcome_b == selected_outcome)
        outcome_b_class += " selected_outcome";

    function toggleOutcome(outcome: any) {
        if (selected_outcome == outcome) {
            select_outcome(null);
        } else {
            select_outcome(outcome);
        }
    }

    return (
        <div className="moneyline-prop">
            <div className={outcome_a_class} onClick={() => { toggleOutcome(outcome_a) }}>
                <span className="outcome-name">{outcome_a}</span>
                <span className="odds">{formatNumberWithSign(curr_odds_a)}</span>
            </div>
            <div className="versus">vs</div>
            <div className={outcome_b_class} onClick={() => { toggleOutcome(outcome_b) }}>
                <span className="outcome-name">{outcome_b}</span>
                <span className="odds">{formatNumberWithSign(curr_odds_b)}</span>
            </div>
        </div>
    );
};