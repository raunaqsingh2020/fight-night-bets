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
    }, 1000);

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


        <div id="accordion-color" data-accordion="collapse" data-active-classes="bg-blue-100 dark:bg-gray-800 text-blue-600 dark:text-white">
          <h2 id="accordion-color-heading-1">
            <button type="button" className="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 dark:border-gray-700 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-800 gap-3" data-accordion-target="#accordion-color-body-1" aria-expanded="true" aria-controls="accordion-color-body-1">
              <span>What is Flowbite?</span>
              <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5" />
              </svg>
            </button>
          </h2>
          <div id="accordion-color-body-1" className="hidden" aria-labelledby="accordion-color-heading-1">
            <div className="p-5 border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <p className="mb-2 text-gray-500 dark:text-gray-400">Flowbite is an open-source library of interactive components built on top of Tailwind CSS including buttons, dropdowns, modals, navbars, and more.</p>
              <p className="text-gray-500 dark:text-gray-400">Check out this guide to learn how to <a href="/docs/getting-started/introduction/" className="text-blue-600 dark:text-blue-500 hover:underline">get started</a> and start developing websites even faster with components on top of Tailwind CSS.</p>
            </div>
          </div>
        </div>

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
