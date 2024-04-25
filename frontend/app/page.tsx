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
        setCurrentOdds(current_odds);
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

        {selectedOutcome && outcomeToOddsMap && outcomeToEventIdMap &&
          <Cart
            selected_event_id={outcomeToEventIdMap.get(selectedOutcome)}
            selected_outcome={selectedOutcome}
            odds={outcomeToOddsMap.get(selectedOutcome)}
          />
        }

        {/* <p className="section">How it Works</p> */}
      </div>
    </div>
  );
}
