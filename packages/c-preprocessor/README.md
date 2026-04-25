C Preprocessor
===============

C Preprocessor is a preprocessor created with Node.js only and
running like a C preprocessor with **#** directives.  
It was originally designed for Javascript but you can use it
with any language you want.  
See changelog [here](../master/CHANGELOG.md).


## Installation

For local installation, run the following command:
```
npm install c-preprocessor --save
```

For global installation, run the following command:
```
npm install -g c-preprocessor
```


## Compile a file/text

#### In command line
If you have installed this package in global, you can run **c-preprocessor** and pass your main file and output file in arguments.
```
c-preprocessor mainFile.js outputFile.js
```

Additionally you can specify a configuration file (see below for it's format):
```
c-preprocessor --config configFile.js mainFile.js outputFile.js
```

#### With require()
```js
var compiler = require("c-preprocessor");


// To compile a file
compiler.compileFile(fileName, [ options, ] function(err, result) {

	if (err)
		return console.log(err);

	console.log(result);
});


// To compile a text
compiler.compile(code, [ options, ] function(err, result) {
	// ...
});


// Or use Compiler class
var c = new compiler.Compiler([options]);
c.on('success', /* ... */)
c.on('error', /* ... */)

c.compile(code);
// or
c.compileFile(fileName);
```




## Customize options
This are the defaults options. You can modify them by passing an option object.
```js
var options = {
	
	// Predefined constants (ex: { "MY_CONST": "42" })
	constants: {},

	// Predefined macros (ex: { "MACRO": "(a,b) a+b" })
	macros: {},

	// End of line character
	newLine: '\n',

	// Escape '//#' & '/*#' comments (see extra/comments)
	commentEscape: true,
	
	// Empty lines to add between code and included files
	includeSpaces: 0,
	
	// Limit of empty following lines (0 = no limit)
	emptyLinesLimit: 0,

	// Base path for including files
	basePath: './',

	// Stop the compiler when an error ocurred ?
	stopOnError: true,

	// Must constants in #enum directive be in hexadecimal ?
	enumInHex: true
};
```




## Usage

### Like a C preprocessor

##### Include
```c
#include "file.js"
```
Include and parse a file.


##### Define
```c
// Define a constant
#define MY_CONST 42

// Define a macro
#define SUM(a,b) a + b
```
Create a constant or a macro.


##### Undefine
```c
#undef MY_CONST
```
Delete a constant or a macro.


##### Condition
```c
#if A + B == 5 && defined(MY_CONST)
  // Do stuff
#elif "MY_CONST2" == "House"
  // Do other stuff
#else
  // Do other stuff
#endif

#ifndef MY_CONST3
  // Do stuff
#endif
```
C like conditions.  
`#if` condition is evaluated in JS so you must add **"** between string
constants.  
Note: `#ifdef C` and `#ifndef C` are faster than `#if defined(C)` and `#if !defined(C)`.


##### Pragma once
```c
#pragma once
```
Include the current file once.


##### Error
```c
#error This is an error
```
Stop the compiler and log the message given after the directive.



### Extra

##### Compiler constants
```c
__TIME__ // Current time
__DATE__ // Current date
__LINE__ // Current line (where this constant is used).
__FILE__ // Current file (where this constant is used).
```
This constants are predefined by the compiler.


##### Comments
```c
//# One line comment

/*#

Multi-lines comment

#*/
```
This comments will be deleted in the compiled file.  
Note: `options.commentEscape` must be `true`.


##### Enumeration
```c
// Here A=0, ..., D=3
#enum
  A, B, C, D
#endenum

// With options, so Car=5, .., Truck=25
#enum start=5, step=10
  Car, Bike, Truck
#endenum
```
C like enumeration.  
You can use this directive for creating a lot of constants.
