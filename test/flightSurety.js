var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");

contract("Flight Surety Tests", async (accounts) => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    participationFee = 20000000000000000000;
    //    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
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

  it("(airline) register and fund 2nd to 5th Airline using registerairline() and fund()", async () => {
    let owner = config.owner;
    let account_A = accounts[2];
    let account_B = accounts[3];
    let account_C = accounts[4];
    let account_D = accounts[5];

    await config.flightSuretyData.fund(account_A, {
      from: account_A,
      value: participationFee,
    });
    await config.flightSuretyData.registerAirline(account_A, { from: owner });

    await config.flightSuretyData.fund(account_B, {
      from: account_B,
      value: participationFee,
    });
    await config.flightSuretyData.registerAirline(account_B, {
      from: account_A,
    });

    await config.flightSuretyData.fund(account_C, {
      from: account_C,
      value: participationFee,
    });
    await config.flightSuretyData.registerAirline(account_C, {
      from: account_B,
    });

    await config.flightSuretyData.fund(account_D, {
      from: account_D,
      value: participationFee,
    });
    await config.flightSuretyData.registerAirline(account_D, {
      from: config.owner,
    });

    await config.flightSuretyData.registerAirline(account_D, {
      from: account_A,
    });
    await config.flightSuretyData.registerAirline(account_D, {
      from: account_B,
    });

    let fifthAccount = await config.flightSuretyData.isAirline.call(account_D);
    //    console.log("fifth airline:",fifthAccount)
    assert.equal(
      fifthAccount,
      true,
      "registering the fifth airline should need the votes of 50% of the airlines registered"
    );
  });
});
