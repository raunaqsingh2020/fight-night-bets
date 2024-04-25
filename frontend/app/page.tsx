"use client"

import { useEffect, useState } from 'react';

import { supabase } from './utils/supabase'

import NavBar from './components/NavBar';
import Moneyline from './components/Moneyline';
import Cart from './components/Cart';

export default function Home() {
  // const [previousOdds, setPreviousOdds] = useState([]);
  const [currentOdds, setCurrentOdds] = useState<any>([]);

  // const [moneylineComponents, setMoneylineComponents] = useState([]);

  // const [selectedOutcomes, setSelectedOutcomes] = useState([]);
  const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
  const [outcomeToOddsMap, setOutcomeToOddsMap] = useState<Map<any, any>>();
  const [outcomeToEventIdMap, setOutcomeToEventIdMap] = useState<Map<any, any>>();

  useEffect(() => {
    async function updateOdds() {
      // setPreviousOdds(currentOdds);
      const { data: current_odds } = await supabase.from('current_odds').select()
      if (current_odds) {
        setCurrentOdds(current_odds.sort((a, b) => a.event_id - b.event_id));
        let newOutcomeToOddsMap = new Map();
        let newOutcomeToEventIdMap = new Map();
        for (const odd of current_odds) {
          newOutcomeToOddsMap.set(odd.outcome_a, odd.odds_a);
          newOutcomeToOddsMap.set(odd.outcome_b, odd.odds_b);

          newOutcomeToEventIdMap.set(odd.outcome_a, odd.event_id);
          newOutcomeToEventIdMap.set(odd.outcome_b, odd.event_id);
        }

        setOutcomeToOddsMap(newOutcomeToOddsMap);
        setOutcomeToEventIdMap(newOutcomeToEventIdMap);
      }
      // if (previousOdds.length === 0) {
      //   setPreviousOdds(current_odds);
      // }
    }

    updateOdds();
    const intervalId = setInterval(() => {
      // console.log("updating odds...");
      updateOdds();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // useEffect(() => {
  //   if (currentOdds.length === previousOdds.length) {
  //     const newMoneylineComponents = [];
  //     for (let i = 0; i < currentOdds.length; i++) {
  //       newMoneylineComponents.push(
  //         <Moneyline
  //           team_a={currentOdds[i].team_a}
  //           team_b={currentOdds[i].team_b}
  //           curr_odds_a={currentOdds[i].odds_a_american}
  //           curr_odds_b={currentOdds[i].odds_b_american}
  //           prev_odds_a={previousOdds[i].odds_a_american ?? null}
  //           prev_odds_b={previousOdds[i].odds_b_american ?? null}
  //         />
  //       );
  //     }

  //     setMoneylineComponents(newMoneylineComponents);
  //   }

  // }, [currentOdds, previousOdds]);

  return (
    <div>
      <NavBar />
      <div style={{ padding: 16 }}>
        <div className="header">
          <p style={{ fontSize: 28, fontWeight: 600 }}>HUNTS VS M&T</p>
          <p className="title" style={{ fontWeight: 600 }}>FIGHT NIGHT</p>
          <p style={{ fontSize: 14, opacity: 0.8, fontWeight: 400 }}>FIGHT FOR THE GREATEST</p>
          <p style={{ fontSize: 14, opacity: 0.8, fontWeight: 400 }}>26 April • 7-8 PM</p>
        </div>

        <p className="section">Proceeds Donated to Charity</p>

        {currentOdds.map((item: any, index: any) => (
          <Moneyline
            key={index}
            outcome_a={item.outcome_a}
            outcome_b={item.outcome_b}
            curr_odds_a={item.odds_a}
            curr_odds_b={item.odds_b}
            prev_odds_a={null}
            prev_odds_b={null}
            selected_outcome={selectedOutcome}
            select_outcome={setSelectedOutcome}
          />
        ))}


        <section className="accordion">
          <div className="tab">
            <input type="checkbox" name="accordion-1" id="cb1" />
            <label htmlFor="cb1" className="tab__label">How it works</label>
            <div className="tab__content">
              <p><b>Place a bet:</b><br />Click the boxer that you want to bet on. Huntsman/M&T winner will resolve to whichever side wins 3+/5 fights.
                Enter your wager amount. Minimum $1, Maximum $10. You will be redirected to Venmo, with a preset comment and transaction.
                Don't edit the comment (or your wager will not go through). Odds are live and so they may change if you wait to submit your payment!
                <br />
                Winners of each fight will be announced by @PennBoxingClub on IG. Payouts will happen shortly thereafter.
              </p>
            </div>
          </div>

          <div className="tab">
            <input type="checkbox" name="accordion-1" id="cb2" />
            <label htmlFor="cb2" className="tab__label">Charity?</label>
            <div className="tab__content">
              <p>This is a fundraiser for charity. All profits at the end will be split evenly to the 5 winners and donated under their name to a charity of their choice.</p>
            </div>
          </div>

          <div className="tab">
            <input type="checkbox" name="accordion-1" id="cb3" />
            <label htmlFor="cb3" className="tab__label">More</label>
            <div className="tab__content">
              <p>
                Since we take the opposite of every bet you place, there is a good chance we lose money across the 6 markets after everything is said and done.
                We made this in one night lol. Stuff will probably break. Please do not try to manipulate the odds or break this. If we see something wrong, we reserve the right to refund you.
                If you see something wrong or have questions, please DM us on IG (@PennBoxingClub).
                For some background, the math behind our odds, and disclaimers, please read <a style={{ color: "#ffb3b2" }} href="https://juanbug.substack.com/p/huntsman-x-m-and-t-fight-night-fundraiser" target="_blank">this</a>.
              </p>
            </div>
          </div>
        </section>

        <div className="h-[200px]"></div>

        {selectedOutcome && outcomeToOddsMap && outcomeToEventIdMap &&
          <Cart
            selected_event_id={outcomeToEventIdMap.get(selectedOutcome)}
            selected_outcome={selectedOutcome}
            odds={outcomeToOddsMap.get(selectedOutcome)}
          />
        }
      </div>
    </div>
  );
}
