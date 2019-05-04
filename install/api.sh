#!/bin/bash
#usage: ./setup.sh folder_name
sudo apt update
sudo apt dist-upgrade -y
sudo apt install build-essential -y
echo "================Finished dist-upgrading================"
sudo apt install apt-transport-https -y
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt update
sudo apt install -y mongodb-org
echo "================Finished installing mongodb 3.6================"
sudo service mongod start
echo "================MongoDB started================"
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install -y npm
echo "================NodeJS & npm installed================"
sudo apt install -y htop
echo "================htop installed================"
sudo apt install -y git
echo "================git installed================"
cd ~
git clone https://github.com/iaace-NA/Supportbot $1
cd $1
echo "================Finshed cloning repository================"
sudo npm install pm2 -g
echo "================Finished installing pm2 via npm global================"
cd api
npm install
cd ../utils
npm install
echo "================Finished installing IAPI deps================"
cd ../
sudo apt autoremove -y
echo "================Finished Apt Autoremove================"
sudo timedatectl set-timezone UTC
echo "================Finished Setting Timezone to UTC================"
echo "Setup script complete. The following needs to be completed by the user:"
echo "- Add config file"
echo "- Add TLS files"
echo "- Restart system"
echo "- Run startup script in start folder"
