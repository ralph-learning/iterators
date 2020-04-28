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
            }
          }
        }
      }

      for(let value of veganIterable) {
        console.log(value.name);
      }

      readline.prompt();

      break
    case '2':
      readline.question('What would you like to log today:', async (item) => {
        const { data } = await axios.get('http://localhost:3001/food');
        const it = data[Symbol.iterator]();
        let position = it.next();
        while(!position.done) {
          const food = position.value.name;
          if(item === food) {
            console.log(`${item} has ${position.value.calories} calories`);
          }

          position = it.next()
        }

        console.log(item);
        readline.prompt();
      });
      break
  }
})

