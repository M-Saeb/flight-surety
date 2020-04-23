pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /* MOVED FROM APP CONTRACT  */
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        bool credited;
    }
    mapping(bytes32 => Flight) private flights;


    struct Insuree{
        bool didBuy;
        uint256 amount;
        bytes32 flightKey;
    }
    mapping(address => Insuree) insurees;


    uint256 public constant PARTICIPATION_FEE = 10 ether;

    //this is for keep tracking of the votes for each airline
    mapping(address => address[]) airlinesVotes;

    struct Airline{
        bool isRegistered;
        bool participated;
    }
    mapping(address => Airline) public airlines;

    // for counting particpated airlines
    uint256 NumberOfAirlines = 0;


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                )
                                public
    {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier registeredCaller()
    {
        require(airlines[msg.sender].isRegistered, "Called is not registered");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                                address airline
                            )
                            external
                            requireIsOperational
                            returns(bool success, uint256 votes)
    {

        //registering the first airline
        if(NumberOfAirlines == 0){
            airlines[airline].participated = true;
            airlines[airline].isRegistered = true;
            NumberOfAirlines ++;
            success = true;
            return (success, 0);
        }

        require(airlines[msg.sender].participated, "the airline didn't pay the participating fee");
        require(!airlines[airline].isRegistered, "airline already registered");

        //registering the 2nd to 4th airline
        if(NumberOfAirlines < 4){
            airlines[airline].isRegistered = true;
            votes = 1;
            return (success, votes);
        }

        //registering the 5th airline and above
        else
        {
            votes = airlinesVotes[airline].length;
            // checking for duplication
            for (uint c = 0; c < airlinesVotes[airline].length; c++){
                if(airlinesVotes[airline][c] == msg.sender){
                    success = false;
                    return(success, votes);
                }
            }

            //adding the vote to the airline
            airlinesVotes[airline].push(msg.sender);
            votes++;

            //checking if the votes for the specific airline is less than
            // half of the airlines registered
            if(airlinesVotes[airline].length < NumberOfAirlines/2){
                success = false;
                return(success, votes);
            }

            else{
                airlines[airline].isRegistered = true;
                success = true;
                return(success, votes);
            }
        }
    }

    function isAirline
                        (
                            address airline
                        )
                        public
                        view
                        returns(bool)
    {
        if(airlines[airline].isRegistered){
            return true;
        } else{
            return false;
        }
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                uint256 amount,
                                string flight,
                                uint256 timeStamp,
                                address airline
                            )
                            external
                            payable
                            requireIsOperational
    {
        bytes32 flightKey = keccak256(abi.encodePacked(airline, flight, timeStamp));
        insurees[msg.sender] = Insuree({
                                        didBuy: true,
                                        amount: amount,
                                        flightKey: flightKey
                                    });    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    bytes32 flightKey
                                )
                                external
                                requireIsOperational
    {
        flights[flightKey].credited = true;
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (

                            )
                            external
                            payable
                            requireIsOperational
    {
        require(address(this).balance > insurees[msg.sender].amount, "contract does not have enough funding");
        bytes32 flightKey = insurees[msg.sender].flightKey;
        require(flights[flightKey].credited, "flight is not credited");
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address airline
                            )
                            public
                            payable
                            requireIsOperational
    {
        require(!airlines[airline].participated, "airline already paid participation fee");
        require(msg.value > PARTICIPATION_FEE, "Message balance is not enough");
        require(airlines[airline].isRegistered, "Airline is not registered");
        airlines[airline].participated = true;
        NumberOfAirlines ++;
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        internal
                        pure
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
                            external
                            payable
    {
        fund(msg.sender);
    }


}

