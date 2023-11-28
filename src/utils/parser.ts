// @ts-nocheck
import TooManyArgumentsException from "../exceptions/TooManyArgumentsException";
import TooFewArgumentsException from "../exceptions/TooFewArgumentsException";
import UnknownOptionException from "../exceptions/UnknownOptionException";

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

const addArgumentsValue = (obj, argsInputs) => {
  for (const key in obj) {
    if (obj[key].isArrayType) {
      obj[key].value = argsInputs.splice(0)
      if (obj[key].value.length === 0)
        throw new TooFewArgumentsException
    } else {
      if (argsInputs.length > 0) {
        obj[key].value = argsInputs.shift();
      } else if (!obj[key].isOptional) {
        throw new TooFewArgumentsException
      }
    }

    obj[key] = obj[key].value

  }


};

const addOptionsValue = (obj, argsInputs, optsInputs) => {
  for (const key in obj) {
    for (let i = 0; i < optsInputs.length; i++) {
      const valIndex = optsInputs[i].indexOf('=') === -1 ? optsInputs[i].length: optsInputs[i].indexOf('=');
      let value = undefined;
      if (optsInputs[i].slice(2, valIndex) === key) {
        value = optsInputs[i].slice(valIndex + 1);
      } else if (optsInputs[i][1] === obj[key].shortKey) {
        value = optsInputs[i].slice(2)
      } else continue
      if (obj[key].needsValue) {
        if (value) {
          obj[key].value = value
        } else {
          if (argsInputs.length > 0)
            obj[key].value = argsInputs.shift()
        }
      } else {
        obj[key].value = true;
      }
      //removing the passed argument
      optsInputs.splice(i, 1);
      break;
    }
    obj[key] = obj[key].value
  }

};



export function parseArguments(signature, inputs) {
  const res = parseSignature(signature);
  const argumentType = []
  const optionType = []
  //Deviding the 'Arguments' and 'Options' from the 'inputs'
  for (const item of inputs) {
    if (item[0] === '-') optionType.push(item)
    else argumentType.push(item)
  }
  addArgumentsValue(res.args, argumentType);
  addOptionsValue(res.opts, argumentType, optionType);
  if (argumentType.length > 0)
    throw new TooManyArgumentsException;
  if (optionType.length > 0)
    throw new UnknownOptionException;
  return res
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
          while (++i < signature.length && signature[++i] !== ":") {}
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
