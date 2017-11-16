#!/usr/bin/env bash
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000;
echo "Rerouting port 80 to port 3000...";
exit;