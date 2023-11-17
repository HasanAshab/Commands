# SamerArtisan

"Build CLI in a structured and organized way"


SamerArtisan is a CLI Inspired by Artisan (Laravel). Its very flexible, feature-rich and also easy to use.


## Table of Contents
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Writing Commands](#writing-commands)
    - [Generating Command](#generating-commands)
    - [Command structure](#command-structure)
    - [Defining Input Expectations](#defining-input-expectations)
      - [Arguments](#arguments)
      - [Options](#options)
      - [Options With Values](#options-with-values)
      - [Option Shortcuts](#option-shortcuts)
      - [Input Arrays](#input-arrays)
      - [Option Arrays](#option-arrays)
      - [Input Descriptions](#input-descriptions)
    - [Command I/O](#command-io)
      - [Retrieving Input](#retrieving-input)
      - [Prompting For Input](#prompting-for-input)
        - [Asking Question](#asking-question)
        - [Asking For Confirmation](#asking-for-confirmation)
        - [Auto-Completion](#auto-completion)
        - [Multiple Choice Questions](#multiple-choice-questions)
      - [Writing Output](#writing-output)
        - [Table](#table)
        - [Progress Bars](#progress-bars)
  - [Registering Commands](#registering-commands)
      - [Adding a Command](#adding-a-command)
      - [Loading Commands From Directory](#loading-commands-from-directory)
    - [Typescript](#typescript)
      - [Typesafe Command](#typesafe-command)
  - [Project Root](#project-root)
  - [Project Name](#project-name)
  - [Core Commands](#core-commands)
  - [Contributing](#contributing)
  


## Installation

```sh
npm install samer-artisan
````


## Quick Start
We will build a minimal CLI with SamerArtisan.

To make it simple, we will do that in a single file (e.g cli.js).

```javascript
// cli.js

const { SamerArtisan, Command } = require("samer-artisan");

//Create a custom command
class Greet extends Command {
  //This should be unique
  signature = "greet";
  
  //This method will be invoked by SamerArtisan
  handle() {
    console.log("Hello user!");
  }
}

//Register the command
SamerArtisan.add(new Greet());


// Start the CLI
SamerArtisan.parse();

```

Our CLI is ready to be used now.
```sh
node cli.js
```

The output will look like this
![alt text](https://github.com/HasanAshab/samer-artisan/blob/master/examples/images/quick-start.jpg?raw=true)
Notice the bottom command on **Available Commands** section, that is added by us.

If you are thinking, what are **list** and **make:command** commands, then read about [core commands](core-commands)

## Writing Commands
For creating actions of your CLI, you have to write commands.

### Generating Commands
To create a new command, you may use the [make:command](#core-command-make:command) command.  
This command will create a new command class in your specified directory.

Lets create a Greet command
```js
node cli.js make:command Greet --dir=commands
```
### Command Structure
After generating your command, you should define appropriate values for the signature and description properties of the class.
These properties will be used when displaying your command using [list](#core-command-list). 
The signature property also allows you to define your command's input expectations. 
The handle method will be called when your command is executed. You may place your command logic in this method.

Let's take a look at an example command.

```js
class Greet extends Command {
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  signature = 'greet {name}';
 
  
  /**
   * The console command description.
   *
   * @var string
   */
  description = 'Greet a person';
 
  /**
   * Execute the console command.
   */
  handle() {
    console.log("Hello ", this.argument("email"));
    // 
  }
}

```
The **handle** method also can be asyncronous by returning promise
```js
/**
 * Execute the console command.
 */
async handle() {
  //Do some DB operations
  const users = await User.find();
}
```
Or by **done** callback on first argument of **handle** method.
```js
/**
 * Execute the console command.
 */
handle(done) {
  //Do some DB operations
  User.find().then(users => {
    // ... Do something with users
    done()
  });
}
```

## Defining Input Expectations
When writing console commands, it is common to gather input from the user through arguments or options.  
SamerArtisan makes it very convenient to define the input you expect from the user using the **signature**
property on your commands. The **signature** property allows you to define the name, arguments, and options 
for the command in a single, expressive, route-like syntax.

### Arguments
All user supplied arguments and options are wrapped in curly braces. In the following example, the command defines one required argument: **name**:
```javascript
/**
 * The name and signature of the console command.
 *
 * @var string
 */
signature = 'greet {name}';
```

You may also make arguments optional or define default values for arguments:
```javascript
// Optional argument...
'greet {name?}'
 
// Optional argument with default value...
'greet {name=foo}'
```

### Options
Options, like arguments, are another form of user input. Options are prefixed by two hyphens **(--)** when they are provided via the command line. There are two types of options: those that receive a value and those that don't. Options that don't receive a value serve as a boolean **"switch"**. Let's take a look at an example of this type of option:
```javascript
/**
 * The name and signature of the console command.
 *
 * @var string
 */
signature = 'greet {name} {--foo}';
```
In this example, the **--foo** switch may be specified when calling the command. If the **--foo** switch is passed, the value of the option will be true. Otherwise, the value will be false:
```sh
node cli.js Hasan --foo 
```

### Options With Values
Next, let's take a look at an option that expects a value. If the user must specify a value for an option, you should suffix the option name with a **=** sign:
```javascript
/**
 * The name and signature of the console command.
 *
 * @var string
 */
signature = 'greet {name} {--foo=}';
```

In this example, the user may pass a value for the option like so. If the option is not specified when invoking the command, its value will be null:
```sh
node cli.js greet Hasan --foo=bar
```
You may assign default values to options by specifying the default value after the option name. If no option value is passed by the user, the default value will be used:
```javascript
'greet {name} {--foo=bar}'
```

### Option Shortcuts
To assign a shortcut when defining an option, you may specify it before the option name and use the **|** character as a delimiter to separate the shortcut from the full option name:
```javascript
'greet {name} {--F|foo}'
```
When invoking the command on your terminal, option shortcuts should be prefixed with a single hyphen and no **=** character should be included when specifying a value for the option:
```sh
node cli.js greet 1 -Fbar
```

### Input Arrays
If you would like to define arguments or options to expect multiple input values, you may use the **\*** character. First, let's take a look at an example that specifies such an argument:
```javascript
'greet {name*}'
```
When calling this method, the name arguments may be passed in order to the command line. For example, the following command will set the value of user to an array with Hasan and Hossain as its values:
```sh
node cli.js greet Hasan Hossain
```
***TODO***
This **\*** character can be combined with an optional argument definition to allow zero or more instances of an argument:
```javascript
'greet {name?*}'
```

### Option Arrays
When defining an option that expects multiple input values, each option value passed to the command should be prefixed with the option name:
```javascript
'greet {--name=*}'
```
Such a command may be invoked by passing multiple **--name** arguments:
```sh
node cli.js greet --name=Hasan --name=Hossain
```

### Input Descriptions
You may assign descriptions to input arguments and options by separating the argument name from the description using a colon. If you need a little extra room to define your command, feel free to spread the definition across multiple lines:

```javascript
/**
 * The name and signature of the console command.
 *
 * @var string
 */
signature = `greet 
                  {name : The name of the user}
                  {--foo : An example option}`;
```

## Command I/O

### Retrieving Input
While your command is executing, you will likely need to access the values for the arguments and options accepted by your command. To do so, you may use the **argument** and **option** methods.
```javascript
/**
 * Execute the console command.
 */
handle() {
  const name = this.argument('user');
}
```
If you need to retrieve all of the arguments as an array, call the **arguments** method:

```javascript
  const arguments = this.arguments();
```
Options may be retrieved just as easily as arguments using the option method. To retrieve all of the options as an array, call the **options** method:

```javascript
// Retrieve a specific option...
const queueName = this.option('queue');
 
// Retrieve all options as an array...
const options = this.options();
```

If you passed an argument or option name that doest not marked on the signature, the **argument** and **option** method will throw an error.
```javascript
signature = "greet {name} {--foo}"

handle() {
  //Works fine
  this.argument('name');
  this.option('foo');
  
  //Will throw error
  this.argument('age');
  this.option('bar');
}
```

## Prompting For Input
SamerArtisan prompting is built on the top of [prompts](https://www.npmjs.com/package/prompts) package for providing you an elegant API and ease of use. If you need more flexibility over prompting, please use [prompts](https://www.npmjs.com/package/prompts) package directly in your command.

### Asking Question
In addition to displaying output, you may also ask the user to provide input during the execution of your command. The **ask** method will prompt the user with the given question, accept their input, and then return the user's input back to your command:
```javascript
function handle() {
  name = this.ask('What is your name?');
   // ...
}
```
The **secret** method is similar to **ask**, but the user's input will not be visible to them as they type in the console. This method is useful when asking for sensitive information such as _passwords_:
```javascript
password = this.secret('What is the password?');
```

### Asking For Confirmation
If you need to ask the user for a simple **"yes or no"** confirmation, you may use the **confirm** method. By default, this method will return **false**.
```javascript
if (this.confirm('Do you wish to continue?')) {
    // ...
}
```
If necessary, you may specify that the confirmation prompt should return true by default by passing true as the second argument to the confirm method:
```javascript
if (this.confirm('Do you wish to continue?', true)) {
    // ...
}
```

### Auto-Completion
The **anticipate** method can be used to provide auto-completion for possible choices. The user can still provide any answer, regardless of the auto-completion hints:
```javascript
const name = this.anticipate('What is your name?', ['Hasan', 'Hossain']);
```
Alternatively, you may pass a closure as the second argument to the **anticipate** method. The closure will be called each time the user types an input character. The closure should accept a **string** parameter containing the user's input so far, and return an **array** of options for auto-completion:
```javascript
const name = this.anticipate('What is your name?', input => {
    // Return auto-completion options...
});
```
The closure also can be asyncronous
```javascript
const name = this.anticipate('What is your name?', async input => {
  // Do asyncronous operations e.g make some API calls
});
```

### Multiple Choice Questions
If you need to give the user a predefined set of choices when asking a question, you may use the **choice** method. You may set the array index of the default value to be returned if no option is chosen by passing the index as the third argument to the method:
```javascript
const name = this.choice(
    'What is your name?',
    ['Hasan', 'hossain'],
    defaultIndex
);
```
In addition, the choice method accepts optional fourth and fifth arguments for determining whether multiple selections are permitted and the maximum number of selection:
```javascript
const name = this.choice(
    'What is your name?',
    ['Taylor', 'Dayle'],
    $defaultIndex,
    allowMultipleSelections = false,
    max = undefined
);
```

## Writing Output
To send output to the console, you may use the **info**, **comment**, **warn**, **error** and **fail** methods. Each of these methods will use appropriate ANSI colors for their purpose. For example, let's display some general information to the user. Typically, the **info** method will display in the console as green colored text:
```javascript
/**
 * Execute the console command.
 */
handle() {
    // ...
 
    this.info('The command was successful!');
}
```
To display an error message, use the **error** method. Error message text is typically displayed in red:
```javascript
this.error('Something went wrong!');
```

If you want to terminate the command with a single line error message, use **fail** method

```javascript
handle() {
    // ...
    this.fail('Invalid Password!');
    console.log("You will never see that");
}
```

The **fail** method expects an optional help message as second argument. It is used for adding a help message with the error.
```javascript
this.fail('File already exists!', '(use -f to overrite)');
```

### Table
The **table** method makes it easy to correctly format multiple rows / columns of data. SamerArtisan uses [cli-table](https://www.npmjs.com/package/cli-table) package for table generation. For more flexibility, use [cli-table](https://www.npmjs.com/package/cli-table) package directly in your command.
```javascript
this.table(
    ['Name', 'Email'],
  [
    ["Hasan", "foo1@bar.com"],
    ["Hossain", "foo2@bar.com"]
]);
```
### Progress Bars
SamerArtisan uses [cli-progress](https://www.npmjs.com/package/cli-progress) package to provide you a high level and elegant API. For more flexibility over progress bars, use [cli-progress](https://www.npmjs.com/package/cli-progress) package directly in your command.
For long running tasks, it can be helpful to show a progress bar that informs users how complete the task is. Using the **withProgressBar** method, SamerArtisan will display a progress bar and advance its progress for each iteration over a given iterable value:

```javascript
const users = this.withProgressBar(, function (User $user) {
    this.performTask(user);
});
```

## Registering Commands
### Adding a Command
let's say we have a command class in **"./commands/Test.js"** path
```javascript
// ./commands/Test.js

class Test extends Command {
  signature = "test";
  
  handle() {
    console.log("just testing.")
  }
}

module.exports = Test;
```

Now to register this command. we can either do it by importing the command and passing its instance

```javascript
const Test = require("./commands/Test");

SamerArtisan.add(new Test());
```

Or by passing its path
```javascript
SamerArtisan.add("commands/Test.ts");
```

SamerArtisan will join that path with your projects root directory.
read more about [project root](#project-root)

### Loading Commands From Directory
Assume you have 20 commands inside **"./commands"** directory. Do you have enough guts of adding them all manually?  
Even if you registered them manually, the code may loose its maintainability.  

So if you want to register all commands from a directory. You can do
```javascript
SamerArtisan.load("commands");
```

If you have multiple directories of commands
```javascript
SamerArtisan.load([
  "dir1/commands",
  "dir2/commands",
  ...
);
```
Or in chain syntax
```javascript
SamerArtisan
  .load("dir1/commands")
  .load("dir2/commands")
  ...
```
Keep in mind, it may impact performance if you have loaded a lot of directories  
as File i/o is slow in nodejs

## Typescript
SamerArtisan has a strong typing support. Its very easy to write SamerArtisan commands with typescript.

### Typesafe Command
The base **Command** class expects 2 generic type arguments. first one is Arguments and the second one is Options.

Let's look at an example typescript command
```typescript

interface Arguments {
  name: string;
  age: string | null;
  arr: string[];
}

interface Options {
  foo: boolean;
  bar: string | null;
  baz: string;
}

class Greet extends Command<Arguments, Options> {
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  signature = 'greet {name} {age?} {arr*} {--foo} {--bar=} {--baz=default}';
 
  
  /**
   * The console command description.
   *
   * @var string
   */
  description = 'Greet a person';
 
  /**
   * Execute the console command.
   */
  handle() {
    //Now you can retrieve inputs safely
    this.argument("name")
    
    // ...
  }
}

```


## Project Root
SamerArtisan prefix every import with projects root
so that you dont have to manually join path with **__dirname** everytime
```js
// Without this feature
SamerArtisan.add(path.join(__dirname, "commands/Test.ts"));

// With this feature
SamerArtisan.add("commands/Test.ts");
```
You can see it makes your life easy.

But the question is how SamerArtisan detects the root directory?

It uses **_process.cwd()_** for detecting. The **_process.cwd_** function returns 
the path from where the process had been started.

It may not work if you started the process from somewhere else than root directory.
In this case you have to specify root manually.
```js
SamerArtisan.root(myProjectRootDir) 
```
And it's always a best practice to manually specifing root

## Project Name
When you run the cli any arguments
```sh
node cli.js
```
You will see a ASCII art of text **SamerArtisan**. That is projects name. 
if you want to change it, do that
```js
SamerArtisan.name("YourProjectName");
```

## Core Commands
Commands thoose are registered by SamerArtisan are called **core command**
Here are the usage of these core commands in brief

### list
This command is used for listing all available commands of your CLI
```javascript
node [path/to/cli] list
```
And it will print all commands name with its description

### make:command
This command used for generating command components
```sh
node cli.js make:command <Name of the command> --dir=<directory where the component should be putted>
```
The directory you provide will be resolved to absolute. Read about [project root](#project-root) for
better understanding

lets create a command
```javascript
node cli.js make:command Test --dir=commands
```
It will create a command class in **"<root>/commands/Test.js"** file


## Contributing ##
Thank you for considering contributing to our project! We welcome contributions from everyone. Just follow coding best practices