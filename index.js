#! /usr/bin/env node

const axios = require('axios');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `
    ==== MENU ========
    1. Vegan list
    2. Log
    ==================
  `,
});

readline.prompt();
readline.on('line', async (line) => {
  switch(line.trim()) {
    case '1':
      const { data } = await axios.get('http://localhost:3001/food');
      const veganFiltered = data.filter(food => food.diatery_preferency.includes('vegan'));
      let idx = 0;
      const veganIterable = {
        [Symbol.iterator]() {
          return {
            [Symbol.iterator]() { return this; },
            next() {
              const current = veganFiltered[idx];
              idx += 1;
              if(current) {
                return {
                  value: current,
                  done: false
                }
              }

              return {
                value: current,
                done: true
              };
            },
          }
        }
      }

      for(let value of veganIterable) {
        console.log(value.name);
      }

      readline.prompt();

      break
    case '2':
      {
        const { data } = await axios.get('http://localhost:3001/food');
        const it = data[Symbol.iterator]();
        let actionIt;

        const actionIterator = {
          [Symbol.iterator]() {
            let positions = [...this.actions];

            return {
              [Symbol.iterator]() {
                return this;
              },
              next(...args) {
                if(positions.length > 0) {
                  const position = positions.shift();
                  const result = position(...args);

                  return {
                    value: result,
                    done: false,
                  };
                }

                return {
                  done: true,
                };
              },
              return() {
                positions = [];
                return {
                  done: true,
                };
              },
              throw(error) {
                console.log(error);
                return {
                  value: undefined,
                  done: true,
                };
              }
            }
          },
          actions: [askForServingSize, diaplayCalories],
        }

        function askForServingSize(food) {
          readline.question('How many serving did you eat? (as a decimal 1, 0.5, 1.25, etc)',
            (servingSize) => {
              if(servingSize === 'nevermind' | servingSize === 'n') {
                actionIt.return();
              } else {
                actionIt.next(servingSize, food);
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
          console.log(data)
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
              actionIt = actionIterator[Symbol.iterator]();
              actionIt.next(position.value);
            }

            position = it.next()
          }
          readline.prompt();
        });
        break
      }
    default:
      console.log('Use numbers to select the menu options');
      readline.prompt();
  }
})

