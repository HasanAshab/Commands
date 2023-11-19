import { parseArguments, parseDescriptions } from '../../src/utils';
import TooManyArgumentsException from "../../src/exceptions/TooManyArgumentsException";
import TooFewArgumentsException from "../../src/exceptions/TooFewArgumentsException";
import UnknownOptionException from "../../src/exceptions/UnknownOptionException";

it('Should parse args', () => {
  const sign = '{a} {b}';
  const args = ['foo', 'bar'];
  const result = {
    args: {
      a: 'foo',
      b: 'bar',
    },
    opts: {},
  };
  expect(parseArguments(sign, args)).toEqual(result);
});


it('Optional arg value should be the default value if not provided', () => {
  const sign = '{a} {b=bar}';
  const args = ['foo'];
  const result = {
    args: {
      a: 'foo',
      b: 'bar',
    },
    opts: {},
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should throw error if less arguments passed', () => {
  const sign = '{a} {b}';
  let args = ['foo'];
  expect(() => parseArguments(sign, args)).toThrow(TooFewArgumentsException);
});

it('Should throw error if more arguments passed', () => {
  const sign = '{a} {b}';
  let args = ['foo', 'bar', 'baz'];
  expect(() => parseArguments(sign, args)).toThrow(TooManyArgumentsException);
});


it('Should not throw error if an optional arg is not passed', () => {
  const sign = '{a} {b?}';
  const args = ['foo'];
  const result = {
    args: {
      a: 'foo',
      b: null,
    },
    opts: {},
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should not throw error if option is not passed', () => {
  const sign = '{--foo}';
  const args: string[] = [];
  const result = {
    args: {},
    opts: { foo: false },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should throw error if unexpected option is passed', () => {
  const sign = '{--foo}';
  const args = ["--bar"];
  expect(() => parseArguments(sign, args)).toThrow(UnknownOptionException);
});

it.only('Should throw error if input array value not passed', () => {
  const sign = '{foo*}';
  const args: string[] = [];
  expect(() => parseArguments(sign, args)).toThrow(TooFewArgumentsException);
});

it.only('Should not throw error if at least one input array value passed', () => {
  const sign = '{a*}';
  const args: string[] = ["foo"];
  const result = {
    args: { a: ["foo"] },
    opts: {},
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it.only('Should not throw error if more than one input array value passed', () => {
  const sign = '{a*}';
  const args: string[] = ["foo", "bar"];
  const result = {
    args: { a: ["foo", "bar"] },
    opts: {},
  };
  expect(parseArguments(sign, args)).toEqual(result);
});



it('Should handle a combination of positional and optional arguments', () => {
  const sign = '{a} {b?} {c} {d?}';
  const args = ['foo', 'bar', 'baz'];
  const result = {
    args: {
      a: 'foo',
      b: 'bar',
      c: 'baz',
      d: null,
    },
    opts: {},
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

//options
it('Should parse options', () => {
  const sign = '{--foo} {--bar}';
  const args = ['--foo', '--bar'];
  const result = {
    args: {},
    opts: {
      foo: true,
      bar: true,
    },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Option should be false if not provided', () => {
  const sign = '{--foo} {--bar}';
  const args = ['--bar'];
  const result = {
    args: {},
    opts: {
      foo: false,
      bar: true,
    },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should pass option with alias', () => {
  const sign = '{--F|foo}';
  const args = ['-F'];
  const result = {
    args: {},
    opts: { foo: true },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should pass alias option with its real name', () => {
  const sign = '{--F|foo}';
  const args = ['--foo'];
  const result = {
    args: {},
    opts: { foo: true },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should pass value to valued-option', () => {
  const sign = '{--foo=}';
  const args = ['--foo=bar'];
  const result = {
    args: {},
    opts: { foo: 'bar' },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Valued-option should be null if not provided', () => {
  const sign = '{--foo=}';
  const args: string[] = [];
  const result = {
    args: {},
    opts: { foo: null },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Valued-option should be the default value if not provided', () => {
  const sign = '{--foo=bar}';
  const args: string[] = [];
  const result = {
    args: {},
    opts: { foo: 'bar' },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should be empty string if valued-option is provided but value not passed', () => {
  const sign = '{--foo=}';
  const args = ['--foo='];
  expect(parseArguments(sign, args)).toEqual({
    args: {},
    opts: { foo: "" }
  });
});

it('Should pass value to valued-option with alias', () => {
  const sign = '{--F|foo=}';
  const args = ['-Fbar'];
  const result = {
    args: {},
    opts: { foo: 'bar' },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should pass value to aliased-valued-option with its real name', () => {
  const sign = '{--F|foo=}';
  const args = ['--foo=bar'];
  const result = {
    args: {},
    opts: { foo: 'bar' },
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

//input array
it('Should handle a single input array with multiple values', () => {
  const sign = '{users*}';
  const args = ['users', 'user1', 'user2', 'user3'];
  const result = {
    args: {
      users: ['user1', 'user2', 'user3'],
    },
    opts: {},
  };
  expect(parseArguments(sign, args)).toEqual(result);
});

it('Should parse descriptions for args, opts and input arrays', () => {
  const signature = `test 
        { a: First arg }
        { b: Second arg }
        { users*: Third arg }
        { --c: First opt }
        { --d|dog: Second opt }`;

  const result = parseDescriptions(signature);

  const expected = {
    args: {
      a: 'First arg',
      b: 'Second arg',
      users: 'Third arg'
    },
    opts: {
      "--c": 'First opt',
      "-d, --dog": 'Second opt'
    }
  };

  expect(result).toEqual(expected);
});

it('Should parse descriptions for opts only', () => {
  const signature = `test 
        { --foo: First option }
        { --b|bar: Second option }
        { --c|baz: Third option }`;

  const result = parseDescriptions(signature);

  const expected = {
    args: {},
    opts: {
      "--foo": 'First option',
      "-b, --bar": 'Second option',
      "-c, --baz": 'Third option',
    },
  };

  expect(result).toEqual(expected);
});

it('Should parse descriptions for args only', () => {
  const signature = `test 
        { a: First arg }
        { b: Second arg }
        { c: Third arg }`;

  const result = parseDescriptions(signature);

  const expected = {
    args: {
      a: 'First arg',
      b: 'Second arg',
      c: 'Third arg',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle descriptions with whitespace', () => {
  const signature = `test 
        { a: First description with whitespace }
        { b: Second description with whitespace }
        { c: Third description with whitespace }`;

  const result = parseDescriptions(signature);

  const expected = {
    args: {
      a: 'First description with whitespace',
      b: 'Second description with whitespace',
      c: 'Third description with whitespace',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle descriptions with special characters', () => {
  const signature = `test 
        { a: First description with @#$%^&* special characters }
        { b: Second description with ( ) special characters }
        { c: Third description with ! special characters }`;

  const result = parseDescriptions(signature);

  const expected = {
    args: {
      a: 'First description with @#$%^&* special characters',
      b: 'Second description with ( ) special characters',
      c: 'Third description with ! special characters',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle descriptions with no descriptions provided', () => {
  const signature = `test 
        { a }
        { b }
        { c }`;

  const result = parseDescriptions(signature);

  const expected = {
    args: {
      a: null,
      b: null,
      c: null,
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle descriptions with only whitespaces', () => {
  const signature = `test 
        { a:   }
        { b:    }
        { c:  }`;

  const result = parseDescriptions(signature);

  const expected = {
    args: {
      a: "",
      b: "",
      c: "",
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should parse described args', () => {
  const signature = `test 
        { a: First arg }
        { b: Second arg }
        { c: Third arg }`;
  const args = ['foo', 'bar', 'baz'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {
      a: 'foo',
      b: 'bar',
      c: 'baz',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should parse described and non-described args together', () => {
  const signature = `test 
        { a: First arg }
        { b }
        { c: Third arg }`;
  const args = ['foo', 'bar', 'baz'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {
      a: 'foo',
      b: 'bar',
      c: 'baz',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should parse described opts', () => {
  const signature = `test 
        { --foo: First option }
        { --b|bar: Second option }
        { --c|baz: Third option }`;
  const args = ['--foo', '--bar', '--baz'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {},
    opts: {
      foo: true,
      bar: true,
      baz: true,
    },
  };

  expect(result).toEqual(expected);
});

it('Should parse described and non-described opts together', () => {
  const signature = `test 
        { --foo: First option }
        { --b }
        { -c|baz: Third option }`;
  const args = ['--foo', '--b', '--baz'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {},
    opts: {
      foo: true,
      b: true,
      baz: true,
    },
  };

  expect(result).toEqual(expected);
});

it('Should handle a combination of described args and opts', () => {
  const signature = `test 
        { a: First arg }
        { b: Second arg }
        { --foo: First option }
        { --b|bar: Second option }`;
  const args = ['foo', 'bar', '--foo', '-b'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {
      a: 'foo',
      b: 'bar',
    },
    opts: {
      foo: true,
      bar: true,
    },
  };

  expect(result).toEqual(expected);
});

it('Should handle args described with special characters', () => {
  const signature = `test 
        { a: First arg with @#$%^&* special characters }
        { b: Second arg with ( ) special characters }
        { c: Third arg with ! special characters }`;
  const args = ['foo', 'bar', 'baz'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {
      a: 'foo',
      b: 'bar',
      c: 'baz',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle opts described with special characters', () => {
  const signature = `test 
        { --foo: First option with @#$%^&* special characters }
        { --b|bar: Second option with ( ) special characters }
        { --c|baz: Third option with ! special characters }`;
  const args = ['--foo', '--bar', '--baz'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {},
    opts: {
      foo: true,
      bar: true,
      baz: true,
    },
  };

  expect(result).toEqual(expected);
});

it('Should handle optional described arg', () => {
  const signature = `test 
        { a: First arg }
        { b?: Second arg }`;
  const args = ['foo'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {
      a: 'foo',
      b: null,
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle optional described arg with a value', () => {
  const signature = `test 
        { a: First arg }
        { b?: Second arg }`;
  const args = ['foo', 'bar'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {
      a: 'foo',
      b: 'bar',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle optional described arg with a default value', () => {
  const signature = `test 
        { a: First arg }
        { b=bar: Second arg with default value }`;
  const args = ['foo'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {
      a: 'foo',
      b: 'bar',
    },
    opts: {},
  };

  expect(result).toEqual(expected);
});

it('Should handle optional described option', () => {
  const signature = `test 
        { --foo: First option }
        { --bar?: Second option }`;
  const args = ['--foo'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {},
    opts: {
      foo: true,
      bar: null,
    },
  };

  expect(result).toEqual(expected);
});

it('Should handle optional described option with a default value', () => {
  const signature = `test 
        { --foo: First option }
        { --bar=abc: Second option with default value }`;
  const args = ['--foo'];
  const result = parseArguments(signature, args);

  const expected = {
    args: {},
    opts: {
      foo: true,
      bar: 'abc',
    },
  };

  expect(result).toEqual(expected);
});

it('Should parse description', () => {
  const signature = `test 
        { --a: option 1 }
        { --b=abc: option 2 }
        { --c|cat: option 3 }
        { d*: option 4 }
        { e: option 5 }
        { f=69: option 6 }
        { g?: option 7 }
        {       h:        option 8            }
        { --i=: option 9 }
      `;
  const expected = {
    args: {
      d: "option 4",
      e: "option 5",
      f: "option 6",
      g: "option 7",
      h: "option 8",
    },
    opts: {
      "--a": "option 1",
      "--b": "option 2",
      "-c, --cat": "option 3",
      "--i": "option 9",
    },
  };

  expect(parseDescriptions(signature)).toEqual(expected);
});
