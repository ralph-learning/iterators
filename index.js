#! /usr/bin/env node

const axios = require('axios');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `
    ==== MENU ========
    1. Vegan list
    2. Log
    3. Today
    ==================
  `,
});

readline.prompt();
readline.on('line', async (line) => {
  switch(line.trim()) {
    case '1':
      const { data } = await axios.get('http://localhost:3001/food');

      function* listVegaFoods() {
        let idx = 0;
        const veganFiltered = data.filter(food => food.diatery_preferency.includes('vegan'));

        while(veganFiltered[idx]) {
          yield veganFiltered[idx];
          idx++;
        }
      }

      for(let value of listVegaFoods()) {
        console.log(value.name);
      }

      readline.prompt();

      break
    case '2':
      {
        const { data } = await axios.get('http://localhost:3001/food');
        const it = data[Symbol.iterator]();
        let actionIt;

        function* actionGenerator() {
          const food = yield;
          const servingSize = yield askForServingSize();
          yield diaplayCalories(servingSize, food);
        }

        function askForServingSize() {
          readline.question('How many serving did you eat? (as a decimal 1, 0.5, 1.25, etc)',
            (servingSize) => {
              if(servingSize === 'nevermind' | servingSize === 'n') {
                actionIt.return();
              } else {
                actionIt.next(servingSize);
              }
            }
          )
        }

        async function diaplayCalories(servingSize, food) {
          const calories = food.calories;

          console.log(
            `${food.name} with a serving of ${servingSize} has a ${Number.parseFloat(
              calories * parseInt(servingSize, 10),
            ).toFixed()} calories`
          );

          const { data } = await axios.get('http://localhost:3001/users/1');
          const usersLog = data.log || [];
          const putBody = {
            ...data,
            log: [
              ...usersLog,
              {
                [Date.now()]: {
                  food: food.name,
                  servingSize,
                  calories: Number.parseFloat(
                    calories * parseInt(servingSize, 10),
                  ).toFixed()
                }
              }
            ]
          };

          try {
            await axios.put('http://localhost:3001/users/1', {
              ...putBody,
            });
          } catch(error) {
            console.error(error)
          }

          actionIt.next();
          readline.prompt();
        }

        readline.question('What would you like to log today:', async (item) => {
          let position = it.next();
          while(!position.done) {
            const food = position.value.name;
            if(item === food) {
              actionIt = actionGenerator();
              actionIt.next();
              actionIt.next(position.value);
            }

            position = it.next()
          }
          readline.prompt();
        });
        break
      }
    case '3':
      readline.question('Email', async (emailAddress) => {
        const { data } = await axios.get(`http://localhost:3001/users?email=${emailAddress}`);
        const foodLog = data[0].log || [];
        let totalCalories = 0;

        function* getFoodLog() {
          yield* foodLog;
        }

        for(const entry of getFoodLog()) {
          const timestamp = Object.keys(entry);

          if(isToday(new Date(Number(timestamp)))) {
            console.log(`
              ${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)
            `);
            totalCalories += Number(entry[timestamp].calories);
          }
        }

        console.log('-----------');
        console.log(`total calories: ${totalCalories}`);

        readline.prompt();
      });

      break;
    default:
      console.log('Use numbers to select the menu options');
      readline.prompt();
  }
})

function isToday(timestamp) {
  const today = new Date();
  return (
    timestamp.getDate() === today.getDate() &&
    timestamp.getMonth() === today.getMonth() &&
    timestamp.getYear() === today.getYear()
  );
}

