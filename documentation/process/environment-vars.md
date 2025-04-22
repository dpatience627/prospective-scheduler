# Environment Variables

Enviroment variables are simply variables able to be used in the terminal and bash scripts at any time on the VM.

## Adding Environment Variables

Environment variables can be added at any time to the `.bashrc` file on the VM. Make sure to run `exec bash` after adding the environment variables for their presence in the `.bashrc` file to be recognized. Please update this documentation to include new environment variables as well.

## Using Environment Variables

An environment variable can be used in the terminal or in bash scripts by simply typing `$VARIABLE_NAME`. The currently available environment variables and their uses are provided below:

| Name | Purpose |
| ---- | ------- |
| scheduler | Contains the path to the directory containing the git repository for prospective scheduler |
| passphrase | Contains the path to where ssh keys are stored |
| helperscripts | Contains the path to where [automation scripts](./automation-scripts.md) are stored |