const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
const db = null;

const objectSnakeToCamel = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const districtSnakeToCamel = (newObject) => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    status: newObject.status,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

const reportSnakesToCamelCase = (newObject) => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  };
};

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/states/", async (request, response) => {
  const allStateList = `SELECT * FROM state ORDER BY state_id;`;
  const stateList = await db.all(allStateList);
  const stateResult = stateList.map((eachObject) => {
    return objectSnakeToCamel(eachObject);
  });
  response.send(stateResult);
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getState = `SELECT * FROM state
     WHERE state_id=${stateId};`;

  const newState = await db.get(getState);
  const stateRes = objectSnakeToCamel(newState);
  response.send(stateRes);
});

app.post("/districts/", async (request, response) => {
  const createDistricts = request.body;
  const {
    districtName,
    stateId,
    cured,
    active,
    deaths,
    cases,
  } = createDistricts;

  const newDistrict = `INSERT INTO district(district_name,state_id,cured,active,deaths,cases)
    VALUES
    ('${districtName}',
      ${stateId},
      ${cured},
      ${active},
      ${deaths},
      ${cases});`;

  const addDistrict = await db.run(newDistrict);
  const districtId = addDistrict.lastId;
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtID } = request.params;
  const getDistrict = `SELECT * FROM district
    WHERE district_id=${districtId};`;
  const newDistrict = await db.get(getDistrict);
  const districtRes = districtSnakeToCamel(newDistrict);
  response.send(districtRes);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtID } = request.params;
  const delDistrict = `DELETE FROM district
     WHERE district_id=${districtId};`;

  await db.run(delDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtID } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cured,
    active,
    deaths,
    cases,
  } = districtDetails;
  const updateDistrict = `UPDATE district SET
       district_name='${districtName},
       state_id=${stateId},
       cured=${cured},
       active=${active},
       deaths=${deaths},
       cases=${cases}
       WHERE district_id=${districtId};`;

  await db.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `SELECT SUM(cases) AS cases,
         SUM(cured) AS cured,
         SUM(active) AS active,
         SUM(deaths) AS deaths,
     FROM district
     WHERE state_id=${stateId};`;

  const stateReport = await db.get(getStateReport);
  const stateRes = reportSnakesToCamelCase(stateReport);
  response.send(stateRes);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateDetails = `SELECT state_name FROM state
      JOIN district ON state.state_id=district.state_id
      WHERE district.district_id=${districtId};`;

  const stateName = await db.get(stateDetails);
  response.send({ stateName: stateName.state_name });
});

module.exports = app;
