import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

// ganache-cli -a 50 -l 99999999 -m "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat"

(async () => {
  let result = null;
  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log("error message:", error);
      console.log("result message:", result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", () => {
      let flight = DOM.elid("flight-number").value;
      console.log(flight);
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp,
          },
        ]);
      });
    });

    //refund user
    DOM.elid("buy-click").addEventListener("click", () => {
      let value = DOM.elid("buy-amount").value;
      let flight= DOM.elid("buy-flight").value;
      let timestamp = Number(DOM.elid("buy-timestamp").value)
      let airline = DOM.elid("buy-airlines").value

      if(value < 1000000000000000000){
        contract.buy(value, flight, timestamp, airline, (error, result) => {
          console.log('error message:', error)
          console.log('result message:', result)
        })
      }else{
        alert("you can only pay up to 1 ether")
      }
    });

    //the function checks if the user has credit in their account
    DOM.elid("pay-click").addEventListener("click", () => {
      try{
        contract.pay((error,result) => {
          console.log('error message:', error)
          console.log('result message:', result)
        })
        DOM.elid("pay-result").innerText = "you do have credit in your account"
      } catch(e){        
        console.log("pay error ==>", e)
        DOM.elid("pay-result").innerText = "you don't have credit in your account"
      }
    })

  })
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" }, result.error ? String(result.error) : String(result.value))
      );
    section.appendChild(row);
  });
  displayDiv.append(section);
};
