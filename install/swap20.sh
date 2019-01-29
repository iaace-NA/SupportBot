#!/bin/bash
echo "vm.swappiness = 20" | sudo tee -a /etc/sysctl.conf
echo "sysctl vm.swappiness=20" | sudo sh -
echo "================Finshed setting vm.swappiness to 20================"
