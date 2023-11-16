// @ts-nocheck
import ConsoleIO from "../ConsoleIO";


//helper function for parseing single signature
const parseSingleSignature = (i, signature, args, opts) => {
  let key = '';
  const obj = {
    value: '',
    isOptional: false,
  };
  // checking the current signeture is a flag or not
  if (signature[i] === '-') {
    obj.isFlag = true;
    obj.isOptional = true;
    obj.value = false;
    i += 2;
  }
  const validKeys = /[a-zA-Z1-9]/;

  while (i < signature.length && signature[i] !== '}') {
    if (validKeys.test(signature[i])) key += signature[i];
    else if (signature[i] === '|') {
      obj.shortKey = key;
      key = '';
    } else if (signature[i] === '=') {
      let value = '';
      while (signature[++i] !== '}' && signature[i] !== ' ' && signature[i] !== ':')
        value += signature[i];
      obj.value = value === '' ? null: value;
      i--;
      if (obj.isFlag) obj.needsValue = true;
      else obj.isOptional = true;
    } else if (signature[i] === '?') {
      obj.isOptional = true;
      obj.value = null;
    } else if (signature[i] === '*') {
      obj.value = [];
      obj.isArrayType = true;
    } else if (signature[i] === ":") {
      while (signature[++i] !== '}') {}
      i--
    }
    i++;
  }
  if (obj.isFlag) opts[key] = obj;
  else args[key] = obj;
  return i;
};

//helper function for parseing the signatures
const parseSignature = (signature) => {
  const res = {
    args: {},
    opts: {},
  };
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] === '{') {
      while (signature[++i] === " ") {}
      i = parseSingleSignature(i, signature, res.args, res.opts);
    }
  }

  return res;
};

const addArgumentsValue = (obj, inputs) => {
  for (const key in obj) {
    if (obj[key].isArrayType) {
      let i = 0;
      while (i < inputs.length && inputs[i] !== key) i++;
      if (i === inputs.length)
        ConsoleIO.fail("Too Few Arguments.","(use -h for help)")
      obj[key].value = inputs.splice(i).slice(1);
    } else {
      if (inputs.length > 0) {
        obj[key].value = inputs.shift();
      } else if (!obj[key].isOptional) {
        ConsoleIO.fail("Too Few Arguments.","(use -h for help)")
      }
    }

    obj[key] = obj[key].value

  }

  if (inputs.length > 0)
   ConsoleIO.fail("Too Many Arguments.", "(use -h for help)")
};

const addOptionsValue = (obj, inputs) => {
  for (const key in obj) {
    for (let i = 0; i < inputs.length; i++) {
      const valIndex = inputs[i].indexOf('=');
      if (
        inputs[i].slice(2, valIndex === -1 ? inputs[i].length: valIndex) ===
        key
      ) {
        if (obj[key].needsValue) {
          obj[key].value = inputs[i].slice(valIndex + 1);
        } else {
          obj[key].value = true;
        }
        //removing the passed argument
        inputs.splice(i, 1);
        break;
      } else if (inputs[i][1] === obj[key].shortKey) {
        if (obj[key].needsValue) {
          obj[key].value = inputs[i].slice(2);
        } else {
          obj[key].value = true;
        }
        //removing the passed argument
        inputs.splice(i, 1);
        break;
      }
    }
    obj[key] = obj[key].value
  }

  if (inputs.length > 0)
    ConsoleIO.fail("Unknown Option Specified.", "(use -h for help)");
};

export function parseArguments(signature, inputs) {
  const res = parseSignature(signature);
  addArgumentsValue(
    res.args,
    inputs.filter((item) => !item.startsWith('-'))
  );
  addOptionsValue(
    res.opts,
    inputs.filter((item) => item.startsWith('-'))
  );

  return res;
};


export function parseDescriptions(signature) {
  const args = {}
  const opts = {}

  for (let i = 0; i < signature.length; i++) {
    // checking : the new argument started or not
    if (signature[i] === '{') {
      while (signature[++i] === " ") {}
      const isFlag = (signature[i] === '-');
      let key = '';
      let shortKeys = '';
      let description = null;
      const validKeys = /[a-zA-Z1-9\-]/;
      //looping thought the current signature for parsing the argument
      while (i < signature.length && signature[i] !== '}') {
        
        if (validKeys.test(signature[i])) key += signature[i];
        
        else if (signature[i] === "*" || signature[i] === "=") {
          //skiping the unwanted values
          while (signature[++i] !== ":") {}
          i--;
        } else if (signature[i] === '|') {
          shortKeys += `${key.slice(1)}, `;
          key = '--'
        } else if (signature[i] === ':') {
          let desc = '';
          while (signature[++i] !== '}') desc += signature[i];
          description = desc.trim();
          i--;
        }
        i++;
      }
      key = shortKeys + key
      // Now adding the result
      if (isFlag) opts[key] = description;
      else args[key] = description;
    }
  }

  return {
    args,
    opts
  };
}