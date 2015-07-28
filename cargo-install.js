import request from 'request';
import fs from 'fs';
import toml from 'toml-js';

const args = process.argv;

const docs = `Usage:
To search for a packge on crates.io run:
> rpm [s|search] package name

To install a package from crates.io run:
> rpm [i|install] package name
`;

if (args.length === 2) {
  console.log(docs);
} else {
  const command = args[2];
  const commandArgs = args.slice(3);

  switch (command) {
    case 'i':
    case 'install':
      fs.readFile('Cargo.toml', 'utf8', function(err, file) {
        if(err) {
          console.log('Cargo.toml not there, please run `cargo new hello_world` before installing dependencies.');
          return;
        }

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