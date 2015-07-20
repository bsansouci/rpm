const request = require('request');
const fs = require('fs');
const toml = require('toml-js');

const args = process.argv;
if(args.length === 2) {
  console.log(`Usage: [insert docs here]`);
} else {
  const command = args[2];
  const commandArgs = args.slice(3);

  switch (command) {
    case 'i':
    case 'install':
      request("https://crates.io/api/v1/crates?q=" + commandArgs.join('+') + "&page=1&per_page=10&_=" + Date.now(), (err, res, body) => {
        if(err) throw err;

        if(res.statusCode !== 200) {
          throw new Error("Error code wasn't 200: " + res.statusCode);
        }

        const allCrates = JSON.parse(body);
        if(allCrates.meta.total === 0) {
          console.log(`No result found for ${commandArgs.join(' ')}`);
          return;
        }

        const first = allCrates.crates[0];
        console.log(`Number of results: ${allCrates.meta.total} | Using: ${first.id} (${first.max_version}): ${first.description}`);
        if(first.id !== commandArgs.join(" ")) {
          console.log(`Warning: install crate which name doesn\'t entirely match! "${first.id}" VS "${commandArgs.join(" ")}".`);
        }

        const file = fs.readFileSync('Cargo.toml', 'utf8');
        let parsedFile = toml.parse(file);

        // Add dependency field if missing
        if(!parsedFile.dependencies) parsedFile.dependencies = {};

        // Check if dependency already exist, if so what version it's in
        if(parsedFile.dependencies[first.id]) {
          if(parsedFile.dependencies[first.id] !== first.max_version) {
            console.log(`Dependency "${first.id}" exists already but is at version ${parsedFile.dependencies[first.id]} (latest is ${first.max_version}). Run "rpm u ${first.id}" to update.`);
          } else {
            console.log(`Dependency "${first.id}" up to date.`);
          }
          return; // Stop execution
        }

        // Add dependency
        parsedFile.dependencies[first.id] = first.max_version;

        // Convert back to string and write to file
        const retFile = toml.dump(parsedFile);
        fs.writeFileSync('Cargo.toml', retFile);
        console.log(`${first.id} install successfully.`);
      });
      break;
    case 's':
    case 'search':
      request("https://crates.io/api/v1/crates?q=" + commandArgs.join('+') + "&page=1&per_page=10&_=" + Date.now(), (err, res, body) => {
        if(err) throw err;

        if(res.statusCode !== 200) {
          throw new Error("Error code wasn't 200: " + res.statusCode);
        }

        const allCrates = JSON.parse(body);
        if(allCrates.meta.total === 0) {
          console.log(`No result found for ${commandArgs.join(' ')}.`);
          return;
        }
        console.log(`Total number of results: ${allCrates.meta.total}.`);

        allCrates.crates.forEach(crate => {
          console.log(`${crate.id} (${crate.max_version}): ${crate.description}`);
        });
      });
      break;
    case 'u':
    case 'update':
      request("https://crates.io/api/v1/crates?q=" + commandArgs.join('+') + "&page=1&per_page=10&_=" + Date.now(), (err, res, body) => {
        if(err) throw err;

        if(res.statusCode !== 200) {
          throw new Error("Error code wasn't 200: " + res.statusCode);
        }

        const allCrates = JSON.parse(body);
        if(allCrates.meta.total === 0) {
          console.log(`No result found for ${commandArgs.join(' ')}.`);
          return;
        }

        const first = allCrates.crates[0];
        console.log(`Number of results: ${allCrates.meta.total} | Using: ${first.id} (${first.max_version}): ${first.description}.`);
        if(first.id !== commandArgs.join(" ")) {
          console.log(`Warning: install crate which name doesn\'t entirely match! "${first.id}" VS "${commandArgs.join(" ")}".`);
        }

        const file = fs.readFileSync('Cargo.toml', 'utf8');
        let parsedFile = toml.parse(file);

        // Add dependency field if missing
        if(!parsedFile.dependencies || !parsedFile.dependencies[first.id]) {
          console.log(`Dependency "${first.id}" doesn't exist. Run "rpm i ${first.id}" to install it.`);
          return; // Stop execution
        }

        if(parsedFile.dependencies[first.id] === first.max_version) {
          console.log(`Dependency "${first.id}" up to date.`);
          return; // Stop execution
        }

        // Add dependency
        parsedFile.dependencies[first.id] = first.max_version;

        // Convert back to string and write to file
        const retFile = toml.dump(parsedFile);
        fs.writeFileSync('Cargo.toml', retFile);
        console.log(`${first.id} updated successfully to ${first.max_version}.`);
      });
      break;
    default:
      console.log('Unrecognized command', command);
      break;
  }
}

// Copy pasted
function dedent(callSite, ...args) {

    function format(str) {

        let size = -1;

        return str.replace(/\n(\s+)/g, (m, m1) => {

            if (size < 0)
                size = m1.replace(/\t/g, "    ").length;

            return "\n" + m1.slice(Math.min(m1.length, size));
        });
    }

    if (typeof callSite === "string")
        return format(callSite);

    if (typeof callSite === "function")
        return (...args) => format(callSite(...args));

    let output = callSite
        .slice(0, args.length + 1)
        .map((text, i) => (i === 0 ? "" : args[i - 1]) + text)
        .join("");

    return format(output);
}