const { Command } = require("../../../lib");

class Test extends Command {
  signature = "testtsie"
  description = "For testing 3"

  
  async handle() {
    //const fruit1 = await this.anticipate("Do you want", ["apple", "mango"])
    const fruit2 = await this.anticipate("Do you want", input => {
      return new Promise(r => {
        setTimeout(() => {
          r(["apple", "mango"].filter(option => option.startsWith(input.toLowerCase())))
        }, 1500)
      })
    });
    console.log(fruit1)
    console.log(fruit2)
  }
}

module.exports = Test;