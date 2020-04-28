function* randomNum() {
  while(true) {
    yield Math.floor(Math.random() * 100);
  }
}

const it = randomNum();

console.log(it.next().value);
console.log(it.next().value);
console.log(it.next().value);
