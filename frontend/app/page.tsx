"use client"

import { useEffect, useState } from 'react';

import { supabase } from './utils/supabase'

import NavBar from './components/NavBar';
import Moneyline from './components/Moneyline';
import Cart from './components/Cart';

export default function Home() {
  const [status, setStatus] = useState<boolean>(true);
  const [currentOdds, setCurrentOdds] = useState<any>([]);

  const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
  const [outcomeToOddsMap, setOutcomeToOddsMap] = useState<Map<any, any>>();
  const [outcomeToPreviousOddsMap, setOutcomeToPreviousOddsMap] = useState<Map<any, any>>();
  const [outcomeToEventIdMap, setOutcomeToEventIdMap] = useState<Map<any, any>>();

  useEffect(() => {
    async function updateOdds() {
      const { data: current_odds } = await supabase.from('current_odds').select();
      if (current_odds) {
        let newOutcomeToOddsMap = new Map();
        let newOutcomeToPreviousOddsMap = new Map();
        let newOutcomeToEventIdMap = new Map();
        for (const odd of current_odds) {
          newOutcomeToOddsMap.set(odd.outcome_a, odd.odds_a);
          newOutcomeToOddsMap.set(odd.outcome_b, odd.odds_b);

          newOutcomeToEventIdMap.set(odd.outcome_a, odd.event_id);
          newOutcomeToEventIdMap.set(odd.outcome_b, odd.event_id);
        }

        const currentOddsClone = currentOdds.map((a: any) => { return { ...a } });
        for (const odd of currentOddsClone) {
          newOutcomeToPreviousOddsMap.set(odd.outcome_a, odd.odds_a);
          newOutcomeToPreviousOddsMap.set(odd.outcome_b, odd.odds_b);
        }

        setOutcomeToOddsMap(newOutcomeToOddsMap);
        setOutcomeToPreviousOddsMap(newOutcomeToPreviousOddsMap);
        setOutcomeToEventIdMap(newOutcomeToEventIdMap);

        setCurrentOdds(current_odds.sort((a, b) => a.event_id - b.event_id));
      }
    }

    async function updateStatus() {
      const { data: status } = await supabase.from('status').select();
      if (status) {
        setStatus(status[0].status);
      }
    }

    updateOdds();
    updateStatus();
    const intervalId = setInterval(() => {
      updateOdds();
      updateStatus();
    }, 6000);

    return () => clearInterval(intervalId);
  }, []);

  if (!status) {
    return (
      <div>
        <NavBar />
        <div style={{ padding: 16 }}>
          <div className="header">
            <p style={{ fontSize: 28, fontWeight: 600 }}>HUNTS VS MT</p>
            <p className="title" style={{ fontWeight: 600 }}>FIGHT NIGHT</p>
            <p style={{ fontSize: 14, opacity: 0.8, fontWeight: 400 }}>FIGHT FOR THE GREATEST</p>
            <p style={{ fontSize: 14, opacity: 0.8, fontWeight: 400 }}>26 April • 7-8 PM</p>
          </div>

          <p className="section">Currently experiencing technical difficulties... check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div style={{ padding: 16 }}>
        <div className="header">
          <p style={{ fontSize: 28, fontWeight: 600 }}>HUNTS VS MT</p>
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
            prev_odds_a={outcomeToPreviousOddsMap?.get(item.outcome_a) ?? null}
            prev_odds_b={outcomeToPreviousOddsMap?.get(item.outcome_b) ?? null}
            selected_outcome={selectedOutcome}
            select_outcome={setSelectedOutcome}
          />
        ))}


        <section className="accordion">
          <div className="tab">
            <input type="checkbox" name="accordion-1" id="cb1" />
            <label htmlFor="cb1" className="tab__label">How it Works</label>
            <div className="tab__content">
              <p><b>Place a bet:</b><br />Click the boxer that you want to bet on. Hunts/MT winner will resolve to whichever side wins 3 or more out of 5 fights. Enter your wager amount. Minimum $1, Maximum $10. You will be redirected to Venmo, with a preset comment and transaction. Do not edit the comment (or your wager will not go through properly). Odds are live and so they may change if you wait to submit your payment!
                <br /><br />
                Hunts/MT winner will resolve to whichever side wins 3 or more out of 5 fights.
                Hunts Fighters: Mustafa, James, Mo, Arpan, Paul.
                MT Fighters: Joaquin, Albert, Marco, Rishabh, Seth.
                <br /><br />
                Winners of each fight will be announced by @PennBoxingClub on IG. Payouts will happen shortly thereafter. Net proceeds will be donated to Charity. Follow the IG for the latest updates!
                <br /><br />
                <b>Note: You will need to be logged in to your Venmo app if on mobile, or signed in on Desktop. If Venmo does not open up after clicking Submit, try another browser or switch to mobile / PC.</b>
              </p>
            </div>
          </div>

          <div className="tab">
            <input type="checkbox" name="accordion-1" id="cb2" />
            <label htmlFor="cb2" className="tab__label">Fundraiser</label>
            <div className="tab__content">
              <p>All profits at the end will be donated to charity! We will not be taking a cut.</p>
            </div>
          </div>

          <div className="tab">
            <input type="checkbox" name="accordion-1" id="cb3" />
            <label htmlFor="cb3" className="tab__label">More</label>
            <div className="tab__content">
              <p>
                Since we take the opposite of every bet you place, there is a good chance we lose money across the 6 markets after everything is said and done. It is ok, we had fun.
                <br /><br />
                For some background, the math behind our odds, and disclaimers, please read <a style={{ color: "#ffb3b2" }} href="https://juanbug.substack.com/p/huntsman-x-m-and-t-fight-night-fundraiser" target="_blank">this</a>.
                <br /><br />
                Note: We made this in one night lol. Stuff will probably break. Please do not try to manipulate the odds or break this.
                If we see something wrong, we reserve the right to refund you. If you see something wrong or have questions, please DM us on IG (@PennBoxingClub).
              </p>
            </div>
          </div>
        </section>

        <div className="h-[50px]"></div>
        {selectedOutcome && outcomeToOddsMap && outcomeToEventIdMap &&
          <>
            <div className="h-[130px]"></div>
            <Cart
              selected_event_id={outcomeToEventIdMap.get(selectedOutcome)}
              selected_outcome={selectedOutcome}
              odds={outcomeToOddsMap.get(selectedOutcome)}
            />
          </>
        }
      </div>
    </div>
  );
}
