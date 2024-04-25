import React from 'react';

import { formatNumberWithSign } from '../utils/utils.js'

export default function Moneyline({ outcome_a, outcome_b, curr_odds_a, curr_odds_b, prev_odds_a, prev_odds_b, select_outcome, selected_outcome }: any) {
    let outcome_a_class = "outcome";
    if (outcome_a == selected_outcome)
        outcome_a_class += " selected_outcome";
    if (prev_odds_a && parseInt(prev_odds_a) != parseInt(curr_odds_a)) {
        outcome_a_class += parseInt(prev_odds_a) < parseInt(curr_odds_a) ? " higher_odds" : " lower_odds";
    }

    let outcome_b_class = "outcome";
    if (outcome_b == selected_outcome)
        outcome_b_class += " selected_outcome";
    if (prev_odds_b && parseInt(prev_odds_b) != parseInt(curr_odds_b)) {
        outcome_b_class += parseInt(prev_odds_b) < parseInt(curr_odds_b) ? " higher_odds" : " lower_odds";
    }

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
                <div className="chevron">&#x25B6;</div>
                <span className="outcome-name">{outcome_a}</span>
                <span className="odds">{formatNumberWithSign(curr_odds_a)}</span>
            </div>
            <div className="versus">vs</div>
            <div className={outcome_b_class} onClick={() => { toggleOutcome(outcome_b) }}>
                <div className="chevron">&#x25B6;</div>
                <span className="outcome-name">{outcome_b}</span>
                <span className="odds">{formatNumberWithSign(curr_odds_b)}</span>
            </div>
        </div>
    );
};