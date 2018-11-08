#!/bin/bash
#usage: ./setup.sh folder_name
echo "vm.swappiness = 20" | sudo tee -a /etc/sysctl.conf
echo "sysctl vm.swappiness=20" | sudo sh -
echo "================Finshed setting vm.swappiness to 20================"
sudo apt update
sudo apt dist-upgrade -y
sudo apt install build-essential -y
sudo apt install apt-transport-https -y
echo "================Finished dist-upgrading================"
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
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
cd discord
npm install
echo "================Finished installing discord deps================"
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
