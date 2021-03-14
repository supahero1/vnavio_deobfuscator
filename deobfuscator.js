"use strict";

const fs = require("fs");
const s = fs.readFileSync('src.js').toString();
var script = s;

let b = 'abcdefghijklopqrstuxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
let i;
let c = [0, 0, 0];
function nextname() {
  let aa = b[c[0]] + b[c[1]] + b[c[2]];
  if(c[0]++ == b.length - 1) {
    c[0] = 0;
    if(c[1]++ == b.length - 1) {
      c[1] = 0;
      ++c[2];
    }
  }
  return aa;
}
function RC4(string) {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=',
    b = String(string).replace(/=+$/, '');
  let c = '';
  for(let d = 0, e, f, g = 0; f = b.charAt(g++); ~f && (e = d % (4) ? e * 64 + f : f, d++ % (4)) ? c += String.fromCharCode(255 & e >> (-2 * d & 6)) : 0) {
    f = a.indexOf(f);
  }
  return c;
}
var match;
const mapping = {};

function removeObfuscation() {
  match = script.match(/_([0-9a-f]{10,})/);
  while(match != null) {
    if(mapping[match[1]] == null) {
      mapping[match[1]] = nextname();
    }
    script = script.replace(`_${match[1]}`, mapping[match[1]]);
    console.log(`replaced _${match[1]} with ${mapping[match[1]]}`);
    match = script.match(/_([0-9a-f]{10,})/);
  }

  script = script.replace(/\\x20/g, ' ');
  console.log('replaced all \\x20 with whitespace');

  match = script.match(/\\x(.{2})/);
  while(match != null) {
    script = script.replace(`\\x${match[1]}`, '\\' + String.fromCharCode(parseInt(match[1], 16)));
    console.log(`replaced \\x${match[1]} with ${String.fromCharCode(parseInt(match[1], 16))}`);
    match = script.match(/\\x(.{2})/);
  }

  match = script.match(/([0-9a-f]+)_0x([0-9a-f]+)/);
  while(match != null) {
    script = script.replace(`${match[1]}_0x${match[2]}`, `import_${match[2]}`);
    console.log(`replaced ${match[1]}_0x${match[2]} with import_${match[2]}`);
    match = script.match(/([0-9a-f]+)_0x([0-9a-f]+)/);
  }

  match = script.match(/_0x([0-9a-f]+)/);
  while(match != null) {
    if(mapping[match[1]] == null) {
      mapping[match[1]] = nextname();
    }
    script = script.replace(`_0x${match[1]}`, mapping[match[1]]);
    console.log(`replaced _0x${match[1]} with ${mapping[match[1]]}`);
    match = script.match(/_0x([0-9a-f]+)/);
  }

  match = script.match(/((?:[-\+\*/]*0x[0-9a-f]+[-\+\*/]*)+)/);
  while(match != null) {
    if(/[-\+\*/]/.test(match[1][match[1].length - 1]) == true) {
      if(/[^0-9]/.test(script[match.index + match[1].length]) == true) {
        match[1] = match[1].substring(0, match[1].length - 1);
      } else {
        match[1] += script.substring(match.index + match[1].length).match(/(\d*\.\d+)/)[1];
      }
    }
    console.log(match[1], match.index);
    let a = new Function('return ' + match[1])();
    script = script.replace(match[1], a);
    console.log(`replaced ${match[1]} with ${a}`);
    match = script.match(/((?:[-\+\*/]*0x[0-9a-f]+[-\+\*/]*)+)/);
  }

  match = script.match(/([-\+\*/])\((\d+)\)/);
  while(match != null) {
    script = script.replace(`${match[1]}(${match[2]})`, match[1] + match[2]);
    console.log(`replaced ${match[1]}(${match[2]}) with ${match[1] + match[2]}`);
    match = script.match(/([-\+\*/])\((\d+)\)/);
  }

  match = script.match(/(.)\['([a-zA-Z0-9]*?)'\]/);
  while(match != null) {
    if(/[:({,]/.test(match[1]) == true) {
      script = script.replace(`${match[1]}['${match[2]}']`, `${match[1]}'${match[2]}'`);
      console.log(`replaced ${match[1]}['${match[2]}'] with ${match[1]}'${match[2]}'`);
    } else {
      script = script.replace(`${match[1]}['${match[2]}']`, `${match[1]}.${match[2]}`);
      console.log(`replaced ['${match[2]}'] with .${match[2]}`);
    }
    match = script.match(/(.)\['([a-zA-Z0-9]*?)'\]/);
  }
  
  match = script.match(/('[a-zA-Z0-9]+')\(/);
  while(match != null) {
    script = script.replace(/('[a-zA-Z0-9]+')\(/, '[$1](');
    console.log(`replaced ${match[1]}( with [${match[1]}](`);
    match = script.match(/('[a-zA-Z0-9]+')\(/);
  }
}

removeObfuscation();
const arrayname = script.match(/ (.*?)=/)[1];
var contents = script.match(/\[(.*?)\]/)[1];
while(/'.*?'/.test(contents) == true) {
  contents = contents.replace(/'(.*?)'/, '$1');
}
contents = contents.split(',');
var count = +script.match(/}\(import_.*?,(\d+)\)/)[1];
while(count--) {
  contents.push(contents.shift());
}
console.log(`shifted the array of strings`);
script = script.replace(/\];.*?,\d+\)\);/, '];');
console.log(`removed some useless code`);
for(i = 0; i < contents.length; ++i) {
  contents[i] = RC4(contents[i]);
}
const factor = +script.match(/import_.*?=function.*?-(\d+)/)[1];
const base = script.match(/];.*? (import_.*?)=function/)[1];
match = script.match(new RegExp(`[^a-zA-Z0-9]([a-zA-Z]{3})\\((\\d+)\\)`));
while(match != null) {
  script = script.replace(new RegExp(`${match[1]}\\(${match[2]}\\)`), "'" + contents[+match[2] - factor] + "'");
  console.log(`replaced ${match[1]}(${match[2]}) with '${contents[+match[2] - factor]}'`);
  script = script.replace(new RegExp(`${match[1]}=import.*?([,;])`), `${match[1]}=0$1`);
  console.log(`removed the initialisation of ${match[1]}`);
  match = script.match(new RegExp(`[^a-zA-Z0-9]([a-zA-Z]{3})\\((\\d+)\\)`));
}
removeObfuscation();
if(/.*?'use strict'/.test(script) == true) {
  script = script.replace(/.*?'use strict'/, "'use strict'");
  console.log(`removed dead code`);
} else if(/.*?import_.{1,10}\(\)[;,]/.test(script) == true) {
  script = script.replace(/.*?import_.{1,10}\(\)[;,]/, '');
  console.log(`removed dead code`);
} else if(/.*?const .{3}=0/.test(script) == true) {
  script = script.replace(/.*?const .{3}=0/, '');
  console.log(`removed dead code`);
}
script = script.replace(/\^\(\[\^ \]\+\( \+\[\^ \]\+\)\+\)\+\[\^ \]\}/g, '(?:)');
console.log(`got rid of self defending code (if any)`);

fs.writeFileSync('deobfus.js', script);
