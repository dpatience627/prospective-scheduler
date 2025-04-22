# Automation Scripts

Automation scripts are bash scripts on the VM able to be run anywhere on the VM like typical commands.

## Adding Automation Scripts

Automation scripts can be added by going to the `$helperscripts` directory, and creating a new file (without an extension) containing the bash script. Further, make sure that you run `chmod +x FILE_NAME` to give the new script execute permissions. Once done, the script can be run by name from anywhere on the system. Please update this documentation to include new scripts as well.

## Using Automation Scripts

The currently available automation scripts and their uses are provided below:

| Name | Purpose |
| ---- | ------- |
| ps-pull | Pulls the most recent from changes from master |
| ps-start | Effectively starts the prospective scheduler app, starting both the flask and node server |
| ps-stop | Effectively stops the prospective scheduler app, stopping both the node and flask server |
| ps-update | Restarts the prospective scheduler app using the latest changes from master |