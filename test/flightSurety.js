var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");

contract("Flight Surety Tests", async (accounts) => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    participationFee = 11000000000000000000; //added extra for gas
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(
      accessDenied,
      false,
      "Access not restricted to Contract Owner"
    );
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSurety.setTestingMode(true);
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyData.registerAirline(newAirline, {
        from: config.firstAirline,
      });
    } catch (e) {
      // console.log("catch error massge ==> ", e)
    }
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT //SWITCHED FROM FALSE TO TRUE
    assert.equal(
      result,
      false,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  it("(airline) Only existing airline may register a new airline until there are at least four airlines registered", async () => {
    let owner = config.owner;    //fist airline
    let account_A = accounts[2];// second airline
    let account_B = accounts[3];// third airline
    let account_C = accounts[4];// forth airline
    let account_D = accounts[5];// fifth airline

    await config.flightSuretyData.registerAirline(account_A, { from: owner });
    await config.flightSuretyData.fund(account_A, {
      from: account_A,
      value: participationFee,
    });
    
    await config.flightSuretyData.registerAirline(account_B, {from: account_A});
    await config.flightSuretyData.fund(account_B, {
      from: account_B,
      value: participationFee,
    });

    await config.flightSuretyData.registerAirline(account_C, {from: account_B});
    await config.flightSuretyData.fund(account_C, {
      from: account_C,
      value: participationFee,
    });
    
    await config.flightSuretyData.registerAirline(account_D, {from: config.owner});

    try{
      await config.flightSuretyData.fund(account_D, {
        from: account_D,
        value: participationFee,
      });
    }
    catch(e){

    }

    let firstAccount = await config.flightSuretyData.isAirline.call(config.owner);
    let secondAccount = await config.flightSuretyData.isAirline.call(account_A);
    let thirdAccount = await config.flightSuretyData.isAirline.call(account_B);
    let forthAccount = await config.flightSuretyData.isAirline.call(account_C);
    let fifthAccount = await config.flightSuretyData.isAirline.call(account_D);

    assert.equal( firstAccount, true, "first airline is not registered" );
    assert.equal( secondAccount, true, "registered airline should be able to register second airline" );
    assert.equal( thirdAccount, true, "registered airlines should be able to register third airline" );
    assert.equal( forthAccount, true, "registered airlines should be able to register forth airline" );
    assert.equal( fifthAccount, false, "registered airlines should not be able to register fifth airline" );
  });

  it("(airline) registering the fifth airline will require multi-party consensus of 50% registered airlines", async () => {

    let fifthAirlineBeforeVoting = await config.flightSuretyData.isAirline.call(accounts[5]);

    await config.flightSuretyData.registerAirline(accounts[5], {
      from: config.owner,
    });

    await config.flightSuretyData.registerAirline(accounts[5], {
      from: accounts[2],
    });

  
    let fifthAccount = await config.flightSuretyData.isAirline.call(accounts[5]);

    assert.equal( fifthAirlineBeforeVoting, false, "the fifth airline should not be able to participate before voting" );
    assert.equal( fifthAccount, true, "the fifth airline should be registered after getting the votes of 50% of the registered airlines" );

  });

  it("(airline) Airline can be registered, but does not participate in contract until it submits funding of 10 ether", async () => {


  await config.flightSuretyData.registerAirline(accounts[6], {
    from: config.owner,
  });
  
  await config.flightSuretyData.registerAirline(accounts[6], {
    from: accounts[2],
  });
    
  try{
    await config.flightSuretyData.registerAirline(accounts[6], {
      from: accounts[5],
    });
  }catch(e){

  }

  let sixthAirlineBeforefunding = await config.flightSuretyData.isAirline.call(accounts[6]);

  await config.flightSuretyData.fund(accounts[5], {
    from: accounts[5],
    value: participationFee,
  });
  
  try{
    await config.flightSuretyData.registerAirline(accounts[6], {
      from: accounts[5],
    });
  }
  catch(e){
  }
    
  let sixthAirlineAfterfunding = await config.flightSuretyData.isAirline.call(accounts[6]);

  assert(sixthAirlineBeforefunding, false, "the airline should not be registered because the fifth airline didn't pay the participation fee")
  assert(sixthAirlineAfterfunding, true, "the airline should not be registered because the fifth airline didn't pay the participation fee")
  });
});
